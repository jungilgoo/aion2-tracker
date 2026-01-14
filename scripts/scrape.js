const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');

// 환경 변수 로드 (.env 파일이 있는 경우)
try {
  require('dotenv').config();
} catch (e) {
  // GitHub Actions에서는 환경 변수가 이미 설정되어 있으므로 무시
}

// CI 환경 감지
const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

// 상수 정의
const TIMING = {
  REACT_APP_LOAD_DELAY: 8000,  // React 앱 로딩 대기 시간 (ms)
  REQUEST_INTERVAL: 2000,       // 서버 부하 방지를 위한 요청 간격 (ms)
  PAGE_LOAD_TIMEOUT: isCI ? 60000 : 30000,     // 페이지 로딩 타임아웃 (ms) - CI에서 2배
  DETAIL_PAGE_DELAY: 3000,      // 상세 페이지 로딩 대기 (ms)
  ATOOL_PAGE_LOAD_DELAY: isCI ? 8000 : 3000,  // aion2tool 페이지 로딩 후 추가 대기 (ms) - CI에서 더 길게
  ATOOL_SEARCH_DELAY: isCI ? 10000 : 5000,    // aion2tool 검색 결과 대기 (ms) - CI에서 10초
  ATOOL_TAB_WAIT_TIMEOUT: 20000,              // aion2tool 탭 요소 대기 타임아웃 (ms)
  ATOOL_CLOUDFLARE_WAIT: isCI ? 45000 : 30000 // Cloudflare 챌린지 대기 (ms) - CI에서 45초
};

// Supabase 초기화
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 서버 정보 (마족 루미엘 = race:2, serverId:2004)
const SERVER_CONFIG = {
  race: 2,
  serverId: 2004,
  serverName: '마족 루미엘'
};

/**
 * 캐릭터 검색 및 아이템 레벨 추출
 */
async function scrapeCharacter(page, characterName) {
  console.log(`\n🔍 Searching for: ${characterName}`);

  try {
    // 1. URL 직접 구성하여 검색 결과 페이지로 이동
    const searchUrl = `https://aion2.plaync.com/ko-kr/characters/index?race=${SERVER_CONFIG.race}&serverId=${SERVER_CONFIG.serverId}&keyword=${encodeURIComponent(characterName)}`;
    console.log(`   URL: ${searchUrl}`);
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: TIMING.PAGE_LOAD_TIMEOUT });

    // React 앱 로딩 대기
    await page.waitForTimeout(TIMING.REACT_APP_LOAD_DELAY);

    // 2. 검색 결과 항목 찾기
    console.log(`   Looking for search results...`);

    // 3. 모든 검색 결과 항목 가져오기
    const resultItems = await page.$$('.search-result__item');
    console.log(`   Found ${resultItems.length} result items`);

    if (resultItems.length === 0) {
      console.log(`   ❌ No search results found`);
      return null;
    }

    // 4. 정확히 일치하는 캐릭터 찾기
    let targetItem = null;

    for (const item of resultItems) {
      const nameElement = await item.$('.search-result__item-name');
      if (!nameElement) continue;

      const nameText = await nameElement.textContent();
      if (nameText && nameText.trim() === characterName) {
        targetItem = item;
        console.log(`   ✅ Found exact match: "${nameText.trim()}"`);
        break;
      }
    }

    if (!targetItem) {
      console.log(`   ❌ Exact character "${characterName}" not found`);
      return null;
    }

    // 5. 캐릭터 항목 클릭
    console.log(`   Clicking character item...`);
    await targetItem.click();

    // 페이지 이동 대기
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(TIMING.DETAIL_PAGE_DELAY);

    // 6. 아이템 레벨 및 클래스 추출
    const itemLevel = await page.$eval('.profile__info-item-level span', el => el.textContent.trim());

    // 클래스 정보 추출 (이미지 src에서 추출)
    let characterClass = null;
    try {
      // 클래스 아이콘 이미지에서 추출
      const classImageSrc = await page.$eval('img[src*="class_icon_"]', el => el.src);

      // URL에서 클래스명 추출: class_icon_elementalist.png → elementalist
      const match = classImageSrc.match(/class_icon_(\w+)\.png/);
      if (match && match[1]) {
        const classKey = match[1];

        // 영문 클래스명을 한글로 변환 (AION2 클래스)
        const classNames = {
          'elementalist': '정령성',
          'assassin': '살성',
          'ranger': '궁성',
          'chanter': '호법성',
          'cleric': '치유성',
          'gladiator': '검성',
          'sorcerer': '마도성',
          'templar': '수호성'
        };

        characterClass = classNames[classKey] || classKey; // 매핑 없으면 영문 그대로
        console.log(`   🎯 Class detected: ${classKey} → ${characterClass}`);
      }
    } catch (error) {
      console.log(`   ⚠️  Could not extract class information:`, error.message);
    }

    console.log(`   ✅ Item Level: ${itemLevel}`);
    console.log(`   ✅ Class: ${characterClass || 'Unknown'}`);

    return {
      name: characterName,
      itemLevel: parseInt(itemLevel.replace(/,/g, '')), // 쉼표 제거 및 숫자 변환
      characterClass: characterClass,
      server: SERVER_CONFIG.serverName,
      lastUpdated: new Date().toISOString(),
      url: page.url()
    };

  } catch (error) {
    console.error(`   ❌ Error scraping ${characterName}:`, error.message);
    return null;
  }
}

/**
 * aion2tool.com에서 DPS 점수 추출 (URL 직접 접근 방식)
 */
async function scrapeAtoolScore(page, characterName) {
  console.log(`\n🎯 Fetching DPS score: ${characterName}`);

  try {
    // URL 직접 구성 (서버 ID: 2004 = 루미엘)
    const characterUrl = `https://aion2tool.com/char/serverid=2004/${encodeURIComponent(characterName)}`;
    console.log(`   → ${characterUrl}`);

    // 페이지 로드 (간단하게)
    await page.goto(characterUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    console.log('   ✓ 페이지 로드 완료');

    // Cloudflare 챌린지 체크 및 대기
    console.log('   🔍 Cloudflare 체크 중...');
    const hasCloudflare = await page.evaluate(() => {
      const bodyText = document.body.textContent || '';
      return bodyText.includes('Checking your browser') ||
             bodyText.includes('사람인지 확인하는 중') ||
             bodyText.includes('Just a moment');
    });

    if (hasCloudflare) {
      console.log('   ⏳ Cloudflare 챌린지 감지 - 통과 대기 중... (최대 45초)');
      try {
        // Cloudflare 챌린지가 사라질 때까지 대기
        await page.waitForFunction(() => {
          const bodyText = document.body.textContent || '';
          return !bodyText.includes('Checking your browser') &&
                 !bodyText.includes('사람인지 확인하는 중') &&
                 !bodyText.includes('Just a moment');
        }, { timeout: 45000 });
        console.log('   ✅ Cloudflare 챌린지 통과');

        // 챌린지 통과 후 추가 대기 (페이지 리로드 완료)
        await page.waitForTimeout(2000);
      } catch (e) {
        console.log('   ❌ Cloudflare 챌린지 타임아웃 (45초)');
        console.log('   ℹ️  봇으로 감지되었을 가능성이 높습니다');

        // 디버깅용 스크린샷
        try {
          await page.screenshot({ path: `debug-cloudflare-${characterName}.png`, fullPage: false });
          console.log(`   📸 스크린샷 저장: debug-cloudflare-${characterName}.png`);
        } catch (err) {
          console.log(`   ⚠️  스크린샷 저장 실패`);
        }

        return null;
      }
    } else {
      console.log('   ✅ Cloudflare 챌린지 없음');
    }

    // SPA 라우팅 완료 대기: #dps-score-value 요소가 나타날 때까지
    console.log('   ⏳ SPA 라우팅 대기 중...');

    try {
      // 최대 20초 동안 DPS 점수 요소가 나타날 때까지 대기
      await page.waitForSelector('#dps-score-value', {
        timeout: 20000,
        state: 'attached'
      });
      console.log('   ✓ 캐릭터 페이지 로드됨');
    } catch (e) {
      console.log('   ⚠️  캐릭터 페이지 로드 타임아웃 (20초)');

      // URL 확인
      const currentUrl = page.url();
      console.log(`   ℹ️  현재 URL: ${currentUrl}`);

      // 디버깅용 스크린샷 저장
      try {
        await page.screenshot({ path: `debug-atool-${characterName}.png`, fullPage: false });
        console.log(`   📸 스크린샷 저장: debug-atool-${characterName}.png`);
      } catch (err) {
        console.log(`   ⚠️  스크린샷 저장 실패: ${err.message}`);
      }

      // 메인 페이지로 리다이렉트되었거나 캐릭터가 없음
      console.log(`   ⚠️  캐릭터를 찾을 수 없습니다`);
      console.log(`   ℹ️  "${characterName}" 캐릭터가 aion2tool.com에 등록되지 않았을 수 있습니다`);
      return null;
    }

    // 추가 대기 (JavaScript 실행 완료)
    await page.waitForTimeout(2000);

    // DPS 점수 추출 (#dps-score-value)
    console.log('   → DPS 점수 추출 중...');

    // Polling 방식: DPS 점수가 로드될 때까지 대기
    let dpsScore = null;
    const maxAttempts = 15; // 최대 15회 (7.5초)
    const pollInterval = 500;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const result = await page.evaluate(() => {
        const scoreElement = document.querySelector('#dps-score-value');
        if (scoreElement) {
          const scoreText = scoreElement.textContent.trim();

          // 빈 문자열은 에러
          if (scoreText === '') {
            return { found: false, isEmpty: true };
          }

          // "-"는 로딩 중 또는 데이터 없음 (계속 polling)
          if (scoreText === '-') {
            return { found: false, loading: true, text: scoreText };
          }

          // 실제 숫자 값
          if (scoreText) {
            const score = parseInt(scoreText.replace(/,/g, ''));
            return { found: true, score: isNaN(score) ? null : score, text: scoreText };
          }
        }

        // 에러 메시지 확인
        const errorElement = document.querySelector('.error-message, .not-found, [class*="error"]');
        if (errorElement) {
          return { found: false, error: errorElement.textContent.trim() };
        }

        return { found: false, score: null };
      });

      // 실제 DPS 점수를 찾음
      if (result.found && result.score !== null) {
        dpsScore = result.score;
        console.log(`   ✅ DPS Score: ${dpsScore.toLocaleString()} (${attempt}회 시도)`);
        break;
      }

      // 에러 메시지 발견
      if (result.error) {
        console.log(`   ⚠️  에러: ${result.error}`);
        break;
      }

      // "-" 값 (로딩 중) - 계속 polling
      if (result.loading) {
        // 첫 시도에서만 로그 출력
        if (attempt === 1) {
          console.log(`   ⏳ DPS 점수 로딩 중... (값: "-", API 응답 대기)`);
        }
        // 계속 대기
      }

      // 마지막 시도까지 "-"만 나오면 데이터 없음으로 판단
      if (attempt === maxAttempts) {
        if (result.loading) {
          console.log(`   ⚠️  DPS 데이터 없음 (값: "-")`);
          console.log(`   ℹ️  캐릭터 정보는 있지만 DPS 점수가 기록되지 않았습니다`);
          break;
        }

        console.log('   ⚠️  DPS 점수를 찾을 수 없습니다 (타임아웃)');

        // 디버깅: 페이지 상태 확인
        console.log('   🔍 페이지 상태 확인 중...');
        const debugInfo = await page.evaluate(() => {
          const scoreEl = document.querySelector('#dps-score-value');

          return {
            url: window.location.href,
            title: document.title,
            hasScoreElement: !!scoreEl,
            scoreElementText: scoreEl ? scoreEl.textContent : 'not found',
            scoreElementHTML: scoreEl ? scoreEl.innerHTML : 'not found',
            bodyPreview: document.body?.textContent?.substring(0, 300) || '',
            allIdsWithDps: Array.from(document.querySelectorAll('[id*="dps"]')).map(el => ({
              id: el.id,
              text: el.textContent?.substring(0, 50)
            }))
          };
        });

        console.log('   📋 디버그 정보:');
        console.log(`      - URL: ${debugInfo.url}`);
        console.log(`      - Title: ${debugInfo.title}`);
        console.log(`      - #dps-score-value 존재: ${debugInfo.hasScoreElement}`);
        console.log(`      - 텍스트: "${debugInfo.scoreElementText}"`);
        console.log(`      - HTML: ${debugInfo.scoreElementHTML}`);
        console.log(`      - Body 일부: ${debugInfo.bodyPreview.substring(0, 200)}`);
        console.log(`      - DPS 관련 요소들:`, JSON.stringify(debugInfo.allIdsWithDps));

        // 스크린샷 저장
        try {
          await page.screenshot({ path: `debug-timeout-${characterName}.png`, fullPage: true });
          console.log(`   📸 타임아웃 스크린샷 저장: debug-timeout-${characterName}.png`);
        } catch (e) {
          console.log(`   ⚠️  스크린샷 저장 실패`);
        }
      }

      await page.waitForTimeout(pollInterval);
    }

    return dpsScore;

  } catch (error) {
    console.error(`   ❌ Error fetching DPS score for ${characterName}:`, error.message);
    return null;
  }
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('🚀 AION2 Character Tracker - Scraping Started\n');
  console.log(`📅 ${new Date().toLocaleString('ko-KR')}`);
  console.log(`🖥️  환경: ${isCI ? 'CI (GitHub Actions)' : '로컬'}`);
  console.log(`⏱️  타임아웃 설정: ${TIMING.PAGE_LOAD_TIMEOUT / 1000}초\n`);

  // Supabase에서 캐릭터 목록 가져오기
  const { data: characters, error } = await supabase
    .from('characters')
    .select('id, name');

  if (error) {
    console.error('❌ Error fetching characters from Supabase:', error);
    process.exit(1);
  }

  console.log(`📋 Total characters to track: ${characters.length}\n`);

  if (characters.length === 0) {
    console.log('⚠️  No characters to track. Add characters using the web interface.\n');
    return;
  }

  // 봇 감지 우회를 위한 브라우저 설정 (강화!)
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--disable-blink-features=AutomationControlled',  // 자동화 감지 비활성화
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-site-isolation-trials',
      '--disable-features=BlockInsecurePrivateNetworkRequests'
    ]
  });

  // 실제 브라우저처럼 보이도록 컨텍스트 설정
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    extraHTTPHeaders: {
      'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0'
    }
  });

  // 두 개의 페이지 인스턴스 생성
  const officialPage = await context.newPage();  // 공식 사이트용
  const atoolPage = await context.newPage();     // aion2tool.com용 (URL 직접 접근)

  // aion2tool.com 봇 감지 우회 (강화!)
  await atoolPage.addInitScript(() => {
    // navigator.webdriver 속성 완전 제거
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined
    });

    delete navigator.__proto__.webdriver;

    // Chrome 객체 추가 (더 상세하게)
    window.chrome = {
      runtime: {},
      loadTimes: function() {},
      csi: function() {},
      app: {}
    };

    // plugins 배열 추가
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5]
    });

    // languages 설정
    Object.defineProperty(navigator, 'languages', {
      get: () => ['ko-KR', 'ko', 'en-US', 'en']
    });

    // Permissions API 오버라이드
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => (
      parameters.name === 'notifications' ?
        Promise.resolve({ state: Notification.permission }) :
        originalQuery(parameters)
    );

    // 추가 속성들
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      get: () => 8
    });

    Object.defineProperty(navigator, 'deviceMemory', {
      get: () => 8
    });

    // iframe 감지 우회
    Object.defineProperty(HTMLIFrameElement.prototype, 'contentWindow', {
      get: function() {
        return window;
      }
    });
  });

  const results = [];

  // 각 캐릭터 순회하며 데이터 수집
  for (const char of characters) {
    // 1. 공식 사이트에서 아이템 레벨 수집
    const result = await scrapeCharacter(officialPage, char.name);

    if (result) {
      // 2. aion2tool.com에서 DPS 점수 수집 (URL 직접 접근)
      const dpsScore = await scrapeAtoolScore(atoolPage, char.name);

      // 결과에 DPS 점수 추가
      result.dpsScore = dpsScore;
      results.push(result);

      // 3. 캐릭터 정보 업데이트 (아이템 레벨 + DPS 점수)
      const updateData = {
        item_level: result.itemLevel,
        character_class: result.characterClass,
        last_updated: result.lastUpdated,
        url: result.url
      };

      // DPS 점수가 있으면 추가
      if (dpsScore !== null) {
        updateData.dps_score = dpsScore;
      }

      const { error: updateError } = await supabase
        .from('characters')
        .update(updateData)
        .eq('id', char.id);

      if (updateError) {
        console.error(`   ❌ Error updating character ${char.name}:`, updateError);
      }

      // 4. 히스토리 추가 (아이템 레벨 + DPS 점수)
      const historyData = {
        character_id: char.id,
        item_level: result.itemLevel,
        date: result.lastUpdated
      };

      // DPS 점수가 있으면 추가
      if (dpsScore !== null) {
        historyData.dps_score = dpsScore;
      }

      const { error: historyError } = await supabase
        .from('character_history')
        .insert(historyData);

      if (historyError) {
        console.error(`   ❌ Error adding history for ${char.name}:`, historyError);
      }

      // 30일 이전 히스토리 삭제
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { error: deleteError } = await supabase
        .from('character_history')
        .delete()
        .eq('character_id', char.id)
        .lt('date', thirtyDaysAgo.toISOString());

      if (deleteError) {
        console.error(`   ⚠️  Error cleaning old history for ${char.name}:`, deleteError);
      }
    }

    // 요청 간격 (서버 부하 방지)
    await officialPage.waitForTimeout(TIMING.REQUEST_INTERVAL);
  }

  await browser.close();

  console.log('\n✅ Scraping completed!\n');
  console.log('📊 Results:');
  results.forEach(r => {
    const dpsInfo = r.dpsScore ? `DPS: ${r.dpsScore.toLocaleString()}` : 'DPS: N/A';
    console.log(`   ${r.name}: 아이템 ${r.itemLevel} | ${dpsInfo} (${r.server})`);
  });
  console.log('');
}

// 실행
main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

const { chromium } = require('playwright-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { createClient } = require('@supabase/supabase-js');

// Stealth 플러그인 적용 (봇 감지 우회)
chromium.use(StealthPlugin());

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
 * aion2tool.com API에서 DPS 점수 추출 (브라우저 컨텍스트 내 API 호출)
 */
async function scrapeAtoolScore(page, characterName) {
  console.log(`\n🎯 Fetching DPS score: ${characterName}`);

  try {
    // 브라우저 컨텍스트 내에서 API 호출 (쿠키 자동 포함)
    const result = await page.evaluate(async (payload) => {
      try {
        const response = await fetch('https://aion2tool.com/api/character/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          return { error: `${response.status} ${response.statusText}` };
        }

        const data = await response.json();
        return { success: true, data };
      } catch (err) {
        return { error: err.message };
      }
    }, {
      race: SERVER_CONFIG.race,
      server_id: SERVER_CONFIG.serverId,
      keyword: characterName
    });

    if (result.error) {
      console.log(`   ❌ API 요청 실패: ${result.error}`);
      return null;
    }

    console.log('   ✅ API 응답 수신');
    const data = result.data;

    // 응답 구조 확인 (디버깅)
    // console.log(`   🔍 응답 구조: ${JSON.stringify(data).substring(0, 200)}`);

    // 응답에서 캐릭터 데이터 찾기
    let character = null;

    if (data && data.data) {
      // data.data가 배열인 경우
      if (Array.isArray(data.data)) {
        character = data.data.find(char => char.nickname === characterName);
        if (!character && data.data.length > 0) {
          console.log(`   ⚠️  "${characterName}" 정확한 매칭 없음`);
          console.log(`   ℹ️  검색 결과: ${data.data.length}개`);
          console.log(`   ℹ️  첫 번째 결과: ${data.data[0].nickname}`);
        }
      }
      // data.data가 단일 객체인 경우
      else if (data.data.nickname === characterName) {
        character = data.data;
      }
    }
    // data 자체가 캐릭터 정보인 경우
    else if (data && data.nickname === characterName) {
      character = data;
    }
    // data가 배열인 경우
    else if (Array.isArray(data)) {
      character = data.find(char => char.nickname === characterName);
    }

    if (character) {
      const combatScore = character.combat_score;
      const combatScoreMax = character.combat_score_max;

      if (combatScore !== null && combatScore !== undefined) {
        console.log(`   ✅ Combat Score: ${combatScore.toLocaleString()}`);
        if (combatScoreMax) {
          console.log(`   ℹ️  Max Score: ${combatScoreMax.toLocaleString()}`);
        }
        return combatScore;
      } else {
        console.log(`   ⚠️  캐릭터 발견했지만 Combat Score 없음`);
        return null;
      }
    } else {
      console.log(`   ⚠️  "${characterName}" 캐릭터를 찾을 수 없습니다`);
      console.log(`   ℹ️  응답 타입: ${typeof data}, keys: ${data ? Object.keys(data).join(', ') : 'null'}`);
      return null;
    }

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

  // 브라우저 설정 (공식 사이트만 접속, aion2tool.com은 API 직접 호출)
  const browser = await chromium.launch({
    headless: true,  // API 호출 방식으로 변경되어 headless 가능
    args: [
      '--disable-blink-features=AutomationControlled',  // 자동화 감지 비활성화
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-site-isolation-trials',
      '--disable-features=BlockInsecurePrivateNetworkRequests',
      '--start-maximized'  // 창 최대화
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

  // 페이지 인스턴스 생성
  const officialPage = await context.newPage();  // 공식 사이트용
  const atoolPage = await context.newPage();     // aion2tool.com API 호출용

  // aion2tool.com 메인 페이지 로드 (Cloudflare 쿠키 획득)
  console.log('🌐 aion2tool.com 메인 페이지 로드 중...');
  try {
    await atoolPage.goto('https://aion2tool.com/', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Cloudflare 챌린지 확인 및 대기
    const hasCloudflare = await atoolPage.evaluate(() => {
      const bodyText = document.body.textContent || '';
      return bodyText.includes('Checking your browser') ||
             bodyText.includes('사람인지 확인하는 중') ||
             bodyText.includes('Just a moment');
    });

    if (hasCloudflare) {
      console.log('   ⏳ Cloudflare 챌린지 대기 중... (최대 30초)');
      await atoolPage.waitForFunction(() => {
        const bodyText = document.body.textContent || '';
        return !bodyText.includes('Checking your browser') &&
               !bodyText.includes('사람인지 확인하는 중') &&
               !bodyText.includes('Just a moment');
      }, { timeout: 30000 });
    }

    console.log('   ✅ aion2tool.com 준비 완료 (쿠키 획득)\n');
  } catch (e) {
    console.log('   ⚠️ aion2tool.com 로드 실패 - DPS 점수 수집 불가능');
    console.log(`   ℹ️ 에러: ${e.message}\n`);
  }

  const results = [];

  // 각 캐릭터 순회하며 데이터 수집
  for (const char of characters) {
    // 1. 공식 사이트에서 아이템 레벨 수집
    const result = await scrapeCharacter(officialPage, char.name);

    if (result) {
      // 2. aion2tool.com API에서 DPS 점수 수집 (브라우저 컨텍스트 내)
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

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
  ATOOL_PAGE_LOAD_DELAY: isCI ? 5000 : 2000,  // aion2tool 페이지 로딩 대기 (ms) - CI에서 더 길게
  ATOOL_SEARCH_DELAY: isCI ? 5000 : 3000,     // aion2tool 검색 결과 대기 (ms) - CI에서 더 길게
  ATOOL_TAB_WAIT_TIMEOUT: 20000               // aion2tool 탭 요소 대기 타임아웃 (ms)
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
 * aion2tool.com에서 DPS 점수 추출
 */
async function scrapeAtoolScore(page, characterName) {
  console.log(`\n🎯 Fetching DPS score from aion2tool.com: ${characterName}`);

  try {
    // 1. aion2tool.com 메인 페이지로 이동
    console.log('   → aion2tool.com 페이지 로딩 중...');
    console.log(`   ⏱️  타임아웃: ${TIMING.PAGE_LOAD_TIMEOUT / 1000}초 (CI 환경: ${isCI})`);

    // CI 환경에서는 더 관대한 대기 전략 사용
    await page.goto('https://aion2tool.com', {
      waitUntil: isCI ? 'domcontentloaded' : 'load',  // CI에서는 domcontentloaded로 더 빠르게
      timeout: TIMING.PAGE_LOAD_TIMEOUT
    });
    console.log('   ✓ 페이지 기본 로드 완료');

    // 기본 대기 시간
    await page.waitForTimeout(TIMING.ATOOL_PAGE_LOAD_DELAY);

    // 2. 캐릭터 탭 활성화 (라디오 버튼)
    console.log('   → 캐릭터 탭 활성화 중...');

    // 명시적으로 탭 요소가 나타날 때까지 대기
    let tabFound = false;
    try {
      await page.waitForSelector('#tab-character', {
        timeout: TIMING.ATOOL_TAB_WAIT_TIMEOUT,
        state: 'visible'
      });
      tabFound = true;
      console.log('   ✓ 캐릭터 탭 발견');
    } catch (waitError) {
      console.log(`   ⚠️  캐릭터 탭 대기 타임아웃 (${TIMING.ATOOL_TAB_WAIT_TIMEOUT / 1000}초)`);

      // 디버깅: HTML 구조 확인
      console.log('   🔍 페이지 구조 확인 중...');
      const debugInfo = await page.evaluate(() => {
        const radios = Array.from(document.querySelectorAll('input[type="radio"]'));
        const radioInfo = radios.map(r => ({ id: r.id, name: r.name, value: r.value }));

        const tabElements = Array.from(document.querySelectorAll('[id*="tab"]'));
        const tabInfo = tabElements.map(t => ({ id: t.id, tag: t.tagName }));

        return {
          totalRadios: radioInfo.length,
          radioButtons: radioInfo.slice(0, 5),  // 처음 5개만
          tabElements: tabInfo.slice(0, 5),
          hasTabCharacter: !!document.querySelector('#tab-character')
        };
      });

      console.log('   📋 디버그 정보:', JSON.stringify(debugInfo, null, 2));
      console.log('   ❌ 캐릭터 탭을 찾을 수 없습니다');
      return null;
    }

    // 탭 활성화 시도
    const tabActivated = await page.evaluate(() => {
      const tabRadio = document.querySelector('#tab-character');
      if (tabRadio) {
        tabRadio.checked = true;
        tabRadio.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      return false;
    });

    if (!tabActivated) {
      console.log('   ❌ 캐릭터 탭 활성화 실패');
      return null;
    }

    console.log('   ✓ 캐릭터 탭 활성화 완료');
    await page.waitForTimeout(500);

    // 3. 서버 선택 (루미엘)
    console.log('   → 서버 선택 중 (루미엘)...');
    const serverSelected = await page.evaluate(() => {
      const serverSelect = document.querySelector('select');
      if (serverSelect) {
        const lumielOption = Array.from(serverSelect.options).find(opt =>
          opt.textContent.includes('루미엘')
        );
        if (lumielOption) {
          serverSelect.value = lumielOption.value;
          serverSelect.dispatchEvent(new Event('change', { bubbles: true }));
          return lumielOption.textContent;
        }
      }
      return null;
    });

    if (serverSelected) {
      console.log(`   ✓ 서버 선택: ${serverSelected}`);
      await page.waitForTimeout(500);
    } else {
      console.log('   ⚠️  서버 선택 실패 (기본값 사용 가능)');
    }

    // 4. 검색 입력
    console.log('   → 검색어 입력 중...');
    const searchInput = await page.$('input[type="text"]');
    if (!searchInput) {
      console.log('   ❌ 검색창을 찾을 수 없습니다');
      return null;
    }

    await searchInput.fill(characterName);
    console.log(`   ✓ 검색어 입력 완료: "${characterName}"`);

    // 5. 검색 버튼 클릭
    console.log('   → 검색 실행 중...');
    const searchButton = await page.$('button:has-text("검색")');
    if (searchButton) {
      await searchButton.click();
      console.log('   ✓ 검색 버튼 클릭');
    } else {
      await searchInput.press('Enter');
      console.log('   ✓ Enter 키로 검색');
    }

    // 6. 검색 결과 대기
    console.log('   → 검색 결과 로딩 대기 중...');
    await page.waitForTimeout(TIMING.ATOOL_SEARCH_DELAY);

    // 7. 캐릭터 정보 확인 (닉네임으로 검증)
    const characterFound = await page.evaluate((name) => {
      const nicknameElement = document.querySelector('#result-nickname');
      if (nicknameElement) {
        const foundName = nicknameElement.textContent.trim();
        return foundName === name;
      }
      return false;
    }, characterName);

    if (!characterFound) {
      console.log(`   ⚠️  캐릭터 "${characterName}"를 찾을 수 없습니다`);
      return null;
    }
    console.log(`   ✓ 캐릭터 "${characterName}" 발견`);

    // 8. DPS 점수 추출 시도
    console.log('   → DPS 점수 추출 중...');
    let dpsScore = await page.evaluate(() => {
      const scoreElement = document.querySelector('#dps-score-value');
      if (scoreElement) {
        const scoreText = scoreElement.textContent.trim();
        // 쉼표 제거 후 숫자로 변환 (예: "37,475" → 37475)
        const score = parseInt(scoreText.replace(/,/g, ''));
        return isNaN(score) ? null : score;
      }
      return null;
    });

    // 9. DPS 점수가 없으면 "갱신하기" 버튼 클릭
    if (dpsScore === null) {
      console.log('   ⚠️  DPS 점수 없음 → 갱신 시도');

      const refreshButton = await page.$('#character-refresh-btn');
      if (refreshButton) {
        // 쿨다운 확인
        const cooldown = await page.evaluate(() => {
          const cooldownElement = document.querySelector('#character-refresh-cooldown');
          return cooldownElement ? cooldownElement.textContent.trim() : '';
        });

        if (cooldown) {
          console.log(`   ⏳ 갱신 쿨다운: ${cooldown}`);
          return null; // 쿨다운 중이면 null 반환
        }

        try {
          await refreshButton.click();
          console.log('   🔄 갱신하기 버튼 클릭');

          // 갱신 대기 (5초로 단축)
          await page.waitForTimeout(5000);

          // 다시 DPS 점수 추출 시도
          dpsScore = await page.evaluate(() => {
            const scoreElement = document.querySelector('#dps-score-value');
            if (scoreElement) {
              const scoreText = scoreElement.textContent.trim();
              const score = parseInt(scoreText.replace(/,/g, ''));
              return isNaN(score) ? null : score;
            }
            return null;
          });

          if (dpsScore !== null) {
            console.log(`   ✅ 갱신 후 DPS Score: ${dpsScore.toLocaleString()}`);
          } else {
            console.log('   ⚠️  갱신 후에도 DPS 점수를 찾을 수 없습니다');
          }
        } catch (error) {
          console.log('   ❌ 갱신 실패:', error.message);
        }
      } else {
        console.log('   ⚠️  갱신하기 버튼을 찾을 수 없습니다');
      }
    } else {
      console.log(`   ✅ DPS Score: ${dpsScore.toLocaleString()}`);
    }

    return dpsScore;

  } catch (error) {
    console.error(`   ❌ Error fetching DPS score for ${characterName}:`, error.message);
    console.error(`   Stack trace:`, error.stack);
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

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = [];

  // 각 캐릭터 순회하며 데이터 수집
  for (const char of characters) {
    // 1. 공식 사이트에서 아이템 레벨 수집
    const result = await scrapeCharacter(page, char.name);

    if (result) {
      // 2. aion2tool.com에서 DPS 점수 수집
      const dpsScore = await scrapeAtoolScore(page, char.name);

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
    await page.waitForTimeout(TIMING.REQUEST_INTERVAL);
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

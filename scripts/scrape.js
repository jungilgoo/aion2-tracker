const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');

// 상수 정의
const TIMING = {
  REACT_APP_LOAD_DELAY: 8000,  // React 앱 로딩 대기 시간 (ms)
  REQUEST_INTERVAL: 2000,       // 서버 부하 방지를 위한 요청 간격 (ms)
  PAGE_LOAD_TIMEOUT: 30000,     // 페이지 로딩 타임아웃 (ms)
  DETAIL_PAGE_DELAY: 3000       // 상세 페이지 로딩 대기 (ms)
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

    // 클래스 정보 추출 (여러 선택자 시도)
    let characterClass = null;
    try {
      // 첫 번째 시도: 일반적인 클래스 선택자
      characterClass = await page.$eval('.profile__info-class', el => el.textContent.trim());
    } catch (e1) {
      try {
        // 두 번째 시도: 직업/클래스 텍스트 찾기
        characterClass = await page.$eval('.profile__class', el => el.textContent.trim());
      } catch (e2) {
        try {
          // 세 번째 시도: dt/dd 구조에서 찾기
          characterClass = await page.evaluate(() => {
            const dts = document.querySelectorAll('dt');
            for (const dt of dts) {
              if (dt.textContent.includes('클래스') || dt.textContent.includes('직업')) {
                const dd = dt.nextElementSibling;
                return dd ? dd.textContent.trim() : null;
              }
            }
            return null;
          });
        } catch (e3) {
          console.log(`   ⚠️  Could not extract class information`);
        }
      }
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
 * 메인 실행 함수
 */
async function main() {
  console.log('🚀 AION2 Character Tracker - Scraping Started\n');
  console.log(`📅 ${new Date().toLocaleString('ko-KR')}\n`);

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
    const result = await scrapeCharacter(page, char.name);

    if (result) {
      results.push(result);

      // 캐릭터 정보 업데이트
      const { error: updateError } = await supabase
        .from('characters')
        .update({
          item_level: result.itemLevel,
          character_class: result.characterClass,
          last_updated: result.lastUpdated,
          url: result.url
        })
        .eq('id', char.id);

      if (updateError) {
        console.error(`   ❌ Error updating character ${char.name}:`, updateError);
      }

      // 히스토리 추가
      const { error: historyError } = await supabase
        .from('character_history')
        .insert({
          character_id: char.id,
          item_level: result.itemLevel,
          date: result.lastUpdated
        });

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
    console.log(`   ${r.name}: ${r.itemLevel} (${r.server})`);
  });
  console.log('');
}

// 실행
main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

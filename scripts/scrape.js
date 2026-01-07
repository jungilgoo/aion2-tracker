const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');

// 환경 변수 로드 (.env 파일이 있는 경우)
try {
  require('dotenv').config();
} catch (e) {
  // GitHub Actions에서는 환경 변수가 이미 설정되어 있으므로 무시
}

// 상수 정의
const TIMING = {
  REACT_APP_LOAD_DELAY: 8000,
  REQUEST_INTERVAL: 2000,
  PAGE_LOAD_TIMEOUT: 60000,
  DETAIL_PAGE_DELAY: 3000,
  ATOOL_PAGE_LOAD_DELAY: 2000,
  ATOOL_SEARCH_DELAY: 3000
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

// 서버 정보
const SERVER_CONFIG = {
  race: 2,
  serverId: 2004,
  serverName: '마족 루미엘'
};

/**
 * BOT 감지를 우회하는 브라우저 컨텍스트 생성
 */
async function createStealthContext(browser) {
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
      'Sec-Fetch-User': '?1'
    }
  });

  return context;
}

/**
 * 캐릭터 검색 및 아이템 레벨 추출
 */
async function scrapeCharacter(page, characterName) {
  console.log(`\n🔍 Searching for: ${characterName}`);

  try {
    const searchUrl = `https://aion2.plaync.com/ko-kr/characters/index?race=${SERVER_CONFIG.race}&serverId=${SERVER_CONFIG.serverId}&keyword=${encodeURIComponent(characterName)}`;
    console.log(`   URL: ${searchUrl}`);
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: TIMING.PAGE_LOAD_TIMEOUT });

    await page.waitForTimeout(TIMING.REACT_APP_LOAD_DELAY);

    console.log(`   Looking for search results...`);

    const resultItems = await page.$$('.search-result__item');
    console.log(`   Found ${resultItems.length} result items`);

    if (resultItems.length === 0) {
      console.log(`   ❌ No search results found`);
      return null;
    }

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

    console.log(`   Clicking character item...`);
    await targetItem.click();

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(TIMING.DETAIL_PAGE_DELAY);

    const itemLevel = await page.$eval('.profile__info-item-level span', el => el.textContent.trim());

    let characterClass = null;
    try {
      const classImageSrc = await page.$eval('img[src*="class_icon_"]', el => el.src);
      const match = classImageSrc.match(/class_icon_(\w+)\.png/);
      if (match && match[1]) {
        const classKey = match[1];
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
        characterClass = classNames[classKey] || classKey;
        console.log(`   🎯 Class detected: ${classKey} → ${characterClass}`);
      }
    } catch (error) {
      console.log(`   ⚠️  Could not extract class information:`, error.message);
    }

    console.log(`   ✅ Item Level: ${itemLevel}`);
    console.log(`   ✅ Class: ${characterClass || 'Unknown'}`);

    return {
      name: characterName,
      itemLevel: parseInt(itemLevel.replace(/,/g, '')),
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
async function scrapeAtoolScore(page, characterName, retries = 2) {
  console.log(`\n🎯 Fetching DPS score from aion2tool.com: ${characterName}`);

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      if (attempt > 1) {
        console.log(`   🔄 Retry attempt ${attempt}/${retries}`);
      }

      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined
        });
        
        window.chrome = {
          runtime: {}
        };
        
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters) => (
          parameters.name === 'notifications' ?
            Promise.resolve({ state: Notification.permission }) :
            originalQuery(parameters)
        );
        
        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5]
        });
        
        Object.defineProperty(navigator, 'languages', {
          get: () => ['ko-KR', 'ko', 'en-US', 'en']
        });
      });

      await page.goto('https://aion2tool.com', {
        waitUntil: 'domcontentloaded',
        timeout: TIMING.PAGE_LOAD_TIMEOUT
      });
      
      console.log(`   ✅ Page loaded successfully`);
      await page.waitForTimeout(TIMING.ATOOL_PAGE_LOAD_DELAY + 1000);

      const searchInput = await page.$('#character-keyword');
      if (!searchInput) {
        console.log('   ❌ 검색창을 찾을 수 없습니다 (#character-keyword)');
        await page.screenshot({ path: `debug-no-input-${Date.now()}.png` });
        return null;
      }
      console.log('   ✅ 검색창 발견: #character-keyword');

      await searchInput.click();
      await searchInput.fill('');
      await searchInput.type(characterName, { delay: 100 });
      console.log(`   ✅ 검색어 입력: "${characterName}"`);

      await page.waitForTimeout(500);

      const searchButton = await page.$('#search-button');
      if (!searchButton) {
        console.log('   ⚠️  검색 버튼을 찾을 수 없어서 Enter 키 사용');
        await searchInput.press('Enter');
      } else {
        await searchButton.click();
        console.log('   ✅ 검색 버튼 클릭 (#search-button)');
      }

      await page.waitForTimeout(TIMING.ATOOL_SEARCH_DELAY);

      let dpsScore = await page.evaluate(() => {
        const scoreElement = document.querySelector('#dps-score-value');
        if (scoreElement) {
          const scoreText = scoreElement.textContent.trim();
          const score = parseInt(scoreText.replace(/,/g, ''));
          return isNaN(score) ? null : score;
        }
        return null;
      });
      
      if (dpsScore !== null) {
        console.log(`   ✅ DPS Score: ${dpsScore.toLocaleString()}`);
        return dpsScore;
      }

      console.log('   ⚠️  DPS 점수 없음 → 갱신 또는 데이터 없음 확인');

      const refreshButton = await page.$('#character-refresh-btn');
      if (refreshButton) {
        try {
          await refreshButton.click();
          console.log('   🔄 갱신하기 버튼 클릭');

          await page.waitForTimeout(10000);

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
            return dpsScore;
          } else {
            console.log('   ⚠️  갱신 후에도 DPS 점수를 찾을 수 없습니다');
          }
        } catch (error) {
          console.log('   ⚠️  갱신 실패:', error.message);
        }
      } else {
        console.log('   ⚠️  갱신하기 버튼을 찾을 수 없습니다 (캐릭터 데이터 없음)');
      }

      return null;

    } catch (error) {
      console.log(`   ⚠️ Attempt ${attempt} failed: ${error.message}`);
      
      if (attempt === retries) {
        console.log(`   ❌ All ${retries} attempts failed for ${characterName}`);
        
        try {
          await page.screenshot({ 
            path: `debug-${characterName}-${Date.now()}.png` 
          });
          console.log(`   📸 Debug screenshot saved`);
        } catch (screenshotError) {
          // 무시
        }
        
        return null;
      }
      
      await page.waitForTimeout(3000);
    }
  }
  
  return null;
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('🚀 AION2 Character Tracker - Scraping Started\n');
  console.log(`📅 ${new Date().toLocaleString('ko-KR')}\n`);

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

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-features=IsolateOrigins,site-per-process'
    ]
  });

  const context = await createStealthContext(browser);
  const page = await context.newPage();

  const results = [];

  for (const char of characters) {
    const result = await scrapeCharacter(page, char.name);

    if (result) {
      const dpsScore = await scrapeAtoolScore(page, char.name);

      result.dpsScore = dpsScore;
      results.push(result);

      const updateData = {
        item_level: result.itemLevel,
        character_class: result.characterClass,
        last_updated: result.lastUpdated,
        url: result.url
      };

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

      const historyData = {
        character_id: char.id,
        item_level: result.itemLevel,
        date: result.lastUpdated
      };

      if (dpsScore !== null) {
        historyData.dps_score = dpsScore;
      }

      const { error: historyError } = await supabase
        .from('character_history')
        .insert(historyData);

      if (historyError) {
        console.error(`   ❌ Error adding history for ${char.name}:`, historyError);
      }

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

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
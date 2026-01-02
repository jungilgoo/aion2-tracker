const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');

// 환경 변수 로드
require('dotenv').config();

// 상수 정의
const TIMING = {
  REACT_APP_LOAD_DELAY: 8000,
  REQUEST_INTERVAL: 2000,
  PAGE_LOAD_TIMEOUT: 30000,
  DETAIL_PAGE_DELAY: 3000,
  ATOOL_PAGE_LOAD_DELAY: 2000,
  ATOOL_SEARCH_DELAY: 3000
};

// Supabase 초기화
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
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
 * 공식 사이트에서 아이템 레벨 추출
 */
async function scrapeCharacter(page, characterName) {
  console.log(`\n🔍 [공식 사이트] Searching for: ${characterName}`);

  try {
    const searchUrl = `https://aion2.plaync.com/ko-kr/characters/index?race=${SERVER_CONFIG.race}&serverId=${SERVER_CONFIG.serverId}&keyword=${encodeURIComponent(characterName)}`;
    console.log(`   URL: ${searchUrl}`);
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: TIMING.PAGE_LOAD_TIMEOUT });

    await page.waitForTimeout(TIMING.REACT_APP_LOAD_DELAY);

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
async function scrapeAtoolScore(page, characterName) {
  console.log(`\n🎯 [aion2tool] Fetching DPS score: ${characterName}`);

  try {
    await page.goto('https://aion2tool.com', {
      waitUntil: 'networkidle',
      timeout: TIMING.PAGE_LOAD_TIMEOUT
    });
    await page.waitForTimeout(TIMING.ATOOL_PAGE_LOAD_DELAY);

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
      console.log('   ⚠️  캐릭터 탭을 찾을 수 없습니다');
      return null;
    }

    await page.waitForTimeout(500);

    const serverSelected = await page.evaluate(() => {
      const serverSelect = document.querySelector('select');
      if (serverSelect) {
        const lumielOption = Array.from(serverSelect.options).find(opt =>
          opt.textContent.includes('루미엘')
        );
        if (lumielOption) {
          serverSelect.value = lumielOption.value;
          serverSelect.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
      }
      return false;
    });

    if (serverSelected) {
      console.log('   ✅ 서버 선택: 루미엘');
      await page.waitForTimeout(500);
    }

    const searchInput = await page.$('input[type="text"]');
    if (!searchInput) {
      console.log('   ❌ 검색창을 찾을 수 없습니다');
      return null;
    }

    await searchInput.fill(characterName);
    console.log(`   ✅ 검색어 입력: "${characterName}"`);

    const searchButton = await page.$('button:has-text("검색")');
    if (searchButton) {
      await searchButton.click();
      console.log('   ✅ 검색 버튼 클릭');
    } else {
      await searchInput.press('Enter');
      console.log('   ✅ Enter 키 입력');
    }

    await page.waitForTimeout(TIMING.ATOOL_SEARCH_DELAY);

    const dpsScore = await page.evaluate(() => {
      const scoreElement = document.querySelector('#dps-score-value');
      if (scoreElement) {
        const scoreText = scoreElement.textContent.trim();
        return parseInt(scoreText.replace(/,/g, ''));
      }
      return null;
    });

    if (dpsScore !== null) {
      console.log(`   ✅ DPS Score: ${dpsScore.toLocaleString()}`);
      return dpsScore;
    } else {
      console.log('   ⚠️  DPS 점수를 찾을 수 없습니다');
      return null;
    }

  } catch (error) {
    console.error(`   ❌ Error fetching DPS score for ${characterName}:`, error.message);
    return null;
  }
}

/**
 * 메인 함수
 */
async function main() {
  // 명령줄에서 캐릭터 이름 받기 (기본값: 콕)
  const characterName = process.argv[2] || '콕';

  console.log('🚀 단일 캐릭터 테스트 시작\n');
  console.log(`📅 ${new Date().toLocaleString('ko-KR')}`);
  console.log(`🎯 테스트 캐릭터: ${characterName}\n`);

  // Supabase에서 캐릭터 찾기
  const { data: character } = await supabase
    .from('characters')
    .select('id, name')
    .eq('name', characterName)
    .single();

  if (!character) {
    console.error(`❌ 캐릭터 "${characterName}"를 데이터베이스에서 찾을 수 없습니다`);
    console.log('💡 먼저 웹 인터페이스에서 캐릭터를 추가해주세요.');
    process.exit(1);
  }

  console.log(`✅ 캐릭터 발견: ${character.name} (ID: ${character.id})\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. 공식 사이트에서 아이템 레벨 수집
    const result = await scrapeCharacter(page, character.name);

    if (!result) {
      console.error('\n❌ 아이템 레벨 수집 실패');
      await browser.close();
      process.exit(1);
    }

    // 2. aion2tool에서 DPS 점수 수집
    const dpsScore = await scrapeAtoolScore(page, character.name);

    // 3. 결과 출력
    console.log('\n' + '='.repeat(60));
    console.log('📊 수집 결과');
    console.log('='.repeat(60));
    console.log(`캐릭터 이름: ${result.name}`);
    console.log(`클래스: ${result.characterClass}`);
    console.log(`아이템 레벨: ${result.itemLevel.toLocaleString()}`);
    console.log(`DPS 점수: ${dpsScore ? dpsScore.toLocaleString() : 'N/A'}`);
    console.log(`서버: ${result.server}`);
    console.log(`URL: ${result.url}`);
    console.log('='.repeat(60) + '\n');

    // 4. Supabase 업데이트
    console.log('💾 Supabase 업데이트 시작...\n');

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
      .eq('id', character.id);

    if (updateError) {
      console.error('   ❌ 캐릭터 업데이트 실패:', updateError);
    } else {
      console.log('   ✅ 캐릭터 정보 업데이트 완료');
    }

    // 히스토리 추가
    const historyData = {
      character_id: character.id,
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
      console.error('   ❌ 히스토리 추가 실패:', historyError);
    } else {
      console.log('   ✅ 히스토리 추가 완료');
    }

    console.log('\n✅ 테스트 완료!');
    console.log('💡 이제 웹페이지를 새로고침하면 DPS 점수를 확인할 수 있습니다.\n');

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
  } finally {
    await browser.close();
  }
}

// 실행
main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

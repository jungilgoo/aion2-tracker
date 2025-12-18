const { chromium } = require('playwright');
const { put, head, del } = require('@vercel/blob');

// Blob 이름
const BLOB_NAME = 'characters-data';

// 서버 정보 (마족 루미엘 = race:2, serverId:2004)
const SERVER_CONFIG = {
  race: 2,
  serverId: 2004,
  serverName: '마족 루미엘'
};

/**
 * 캐릭터 검색 및 아이템 레벨 추출
 * (lib/scraper.ts의 JavaScript 버전)
 */
async function scrapeCharacter(page, characterName) {
  console.log(`\n🔍 Searching for: ${characterName}`);

  try {
    // 1. URL 직접 구성하여 검색 결과 페이지로 이동
    const searchUrl = `https://aion2.plaync.com/ko-kr/characters/index?race=${SERVER_CONFIG.race}&serverId=${SERVER_CONFIG.serverId}&keyword=${encodeURIComponent(characterName)}`;
    console.log(`   URL: ${searchUrl}`);
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // React 앱 로딩 대기
    await page.waitForTimeout(8000); // 충분한 대기 시간

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
      // 정확히 캐릭터 이름만 있는지 확인 (공백 제거 후 비교)
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
    await page.waitForTimeout(3000);

    // 6. 아이템 레벨 추출
    const itemLevel = await page.$eval('.profile__info-item-level span', el => el.textContent.trim());

    console.log(`   ✅ Item Level: ${itemLevel}`);

    return {
      name: characterName,
      itemLevel: itemLevel.replace(/,/g, ''), // 쉼표 제거
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
 * 캐릭터 데이터 Blob에서 읽기
 */
async function readCharacterData() {
  try {
    // Blob 존재 여부 확인
    const blobInfo = await head(`${BLOB_NAME}.json`);

    if (!blobInfo) {
      return { characters: [] };
    }

    // Blob에서 데이터 읽기
    const response = await fetch(blobInfo.url);
    const content = await response.text();
    return JSON.parse(content);
  } catch (error) {
    // Blob이 없거나 에러 발생 시 빈 배열 반환
    console.log('   ⚠️  No existing data, starting fresh');
    return { characters: [] };
  }
}

/**
 * 캐릭터 데이터 Blob에 저장
 */
async function saveCharacterData(data) {
  const blobName = `${BLOB_NAME}.json`;

  // 기존 Blob이 있으면 삭제
  try {
    const existing = await head(blobName);
    if (existing && existing.url) {
      console.log('   🗑️  Deleting existing blob...');
      await del(existing.url);
    }
  } catch (error) {
    // Blob이 없으면 무시
    console.log('   ℹ️  No existing blob to delete');
  }

  // 새 Blob 생성
  console.log('   💾 Creating new blob...');
  await put(blobName, JSON.stringify(data, null, 2), {
    access: 'public',
    contentType: 'application/json',
  });
  console.log('   ✅ Data saved to Blob Storage');
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('🚀 AION2 Character Tracker - Scraping Started\n');
  console.log(`📅 ${new Date().toLocaleString('ko-KR')}\n`);

  // 캐릭터 데이터 읽기
  const data = await readCharacterData();
  console.log(`📋 Total characters to track: ${data.characters.length}\n`);

  if (data.characters.length === 0) {
    console.log('⚠️  No characters to track. Add characters using the web interface.\n');
    return;
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = [];

  // 각 캐릭터 순회하며 데이터 수집
  for (const char of data.characters) {
    const result = await scrapeCharacter(page, char.name);

    if (result) {
      results.push(result);

      // 기존 데이터에 히스토리 추가
      if (!char.history) {
        char.history = [];
      }
      char.history.push({
        itemLevel: result.itemLevel,
        date: result.lastUpdated
      });

      // 최근 30일 히스토리만 유지
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      char.history = char.history.filter(h => new Date(h.date) > thirtyDaysAgo);

      // 현재 정보 업데이트
      char.itemLevel = result.itemLevel;
      char.lastUpdated = result.lastUpdated;
      char.url = result.url;
    }

    // 요청 간격 (서버 부하 방지)
    await page.waitForTimeout(2000);
  }

  await browser.close();

  // 결과 저장
  await saveCharacterData(data);

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

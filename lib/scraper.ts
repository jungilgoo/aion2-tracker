import { chromium, Page } from 'playwright';

// 서버 정보 (마족 루미엘 = race:2, serverId:2004)
const SERVER_CONFIG = {
  race: 2,
  serverId: 2004,
  serverName: '마족 루미엘'
};

export interface ScrapedCharacter {
  name: string;
  itemLevel: string;
  server: string;
  lastUpdated: string;
  url: string;
}

/**
 * 단일 캐릭터 검색 및 아이템 레벨 추출
 */
export async function scrapeCharacter(page: Page, characterName: string): Promise<ScrapedCharacter | null> {
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
    const itemLevel = await page.$eval('.profile__info-item-level span', el => el.textContent?.trim() || '0');

    console.log(`   ✅ Item Level: ${itemLevel}`);

    return {
      name: characterName,
      itemLevel: itemLevel.replace(/,/g, ''), // 쉼표 제거
      server: SERVER_CONFIG.serverName,
      lastUpdated: new Date().toISOString(),
      url: page.url()
    };

  } catch (error) {
    console.error(`   ❌ Error scraping ${characterName}:`, error instanceof Error ? error.message : String(error));
    return null;
  }
}

/**
 * 브라우저 인스턴스를 생성하고 단일 캐릭터 스크래핑
 * API 라우트에서 사용하기 위한 편의 함수
 */
export async function scrapeSingleCharacter(characterName: string): Promise<ScrapedCharacter | null> {
  console.log('🚀 Starting single character scrape...');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    const result = await scrapeCharacter(page, characterName);
    return result;
  } finally {
    await browser.close();
    console.log('✅ Browser closed');
  }
}

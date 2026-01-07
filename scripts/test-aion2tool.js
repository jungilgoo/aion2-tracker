const { chromium } = require('playwright');

/**
 * aion2tool.com 사이트 구조 조사
 * - 캐릭터 검색 방법
 * - 아툴 점수 표시 위치
 * - 스크래핑 가능 여부
 */
async function investigateAion2Tool() {
  console.log('🔍 aion2tool.com 조사 시작...\n');

  const browser = await chromium.launch({ headless: false }); // 디버깅을 위해 headless: false
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. 메인 페이지 접속
    console.log('📄 Step 1: 메인 페이지 접속');
    await page.goto('https://aion2tool.com', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    console.log('   ✅ 메인 페이지 로드 완료\n');

    // 페이지 타이틀 확인
    const title = await page.title();
    console.log(`   페이지 타이틀: ${title}\n`);

    // 2. 캐릭터 탭 활성화 (라디오 버튼 방식)
    console.log('📄 Step 2: 캐릭터 탭 활성화');

    // 라디오 버튼 방식으로 탭 전환 시도
    const tabActivated = await page.evaluate(() => {
      const tabRadio = document.querySelector('#tab-character');
      if (tabRadio) {
        tabRadio.checked = true;
        // change 이벤트 트리거
        tabRadio.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      return false;
    });

    if (tabActivated) {
      console.log('   ✅ 캐릭터 탭 활성화 완료 (라디오 버튼)\n');
      await page.waitForTimeout(1000);
    } else {
      console.log('   ⚠️  캐릭터 탭을 찾을 수 없습니다\n');
    }

    // 3. 서버 선택 (마족 루미엘)
    console.log('📄 Step 3: 서버 선택 (마족 루미엘)');

    const serverSelected = await page.evaluate(() => {
      // 서버 선택 드롭다운 또는 라디오 버튼 찾기
      const serverSelectors = [
        'select[name="server"]',
        '#server-select',
        'select',
        '[name*="server"]'
      ];

      for (const selector of serverSelectors) {
        const serverSelect = document.querySelector(selector);
        if (serverSelect && serverSelect.tagName === 'SELECT') {
          // 옵션 목록 출력
          const options = Array.from(serverSelect.options).map(opt => ({
            value: opt.value,
            text: opt.textContent.trim()
          }));
          console.log('서버 옵션들:', options);

          // "루미엘" 또는 "마족" 포함된 옵션 찾기
          const lumielOption = Array.from(serverSelect.options).find(opt =>
            opt.textContent.includes('루미엘') || opt.textContent.includes('마족')
          );

          if (lumielOption) {
            serverSelect.value = lumielOption.value;
            serverSelect.dispatchEvent(new Event('change', { bubbles: true }));
            return { success: true, server: lumielOption.textContent };
          }
        }
      }

      // 라디오 버튼 방식 시도
      const radioButtons = document.querySelectorAll('input[type="radio"][name*="server"], input[type="radio"][value*="lumiel"]');
      for (const radio of radioButtons) {
        const label = document.querySelector(`label[for="${radio.id}"]`);
        const labelText = label ? label.textContent : '';
        if (labelText.includes('루미엘') || labelText.includes('마족')) {
          radio.checked = true;
          radio.dispatchEvent(new Event('change', { bubbles: true }));
          return { success: true, server: labelText };
        }
      }

      return { success: false, server: '' };
    });

    if (serverSelected.success) {
      console.log(`   ✅ 서버 선택 완료: ${serverSelected.server}\n`);
      await page.waitForTimeout(500);
    } else {
      console.log('   ⚠️  서버 선택 요소를 찾을 수 없습니다 (기본값 사용 가능)\n');
    }

    // 4. 검색 입력창 찾기
    console.log('📄 Step 4: 검색 입력창 찾기');

    const searchSelectors = [
      '#search-input',
      'input[type="text"]',
      'input[placeholder*="캐릭터"]',
      'input[name*="search"]',
      '.search-input'
    ];

    let searchInput = null;
    for (const selector of searchSelectors) {
      try {
        const element = await page.$(selector);
        if (element && await element.isVisible()) {
          console.log(`   ✅ 검색창 발견: ${selector}`);
          searchInput = element;
          break;
        }
      } catch (e) {
        // 선택자가 없으면 다음으로
      }
    }

    if (!searchInput) {
      console.log('   ❌ 검색창을 찾을 수 없습니다\n');

      // 페이지 HTML 구조 출력 (디버깅용)
      console.log('📄 페이지 HTML 구조 샘플:');
      const bodyHTML = await page.evaluate(() => {
        return document.body.innerHTML.substring(0, 2000); // 처음 2000자만
      });
      console.log(bodyHTML);
      console.log('\n');
    } else {
      // 5. 실제 캐릭터 검색
      console.log('📄 Step 5: 실제 캐릭터 검색');
      // 명령줄 인자로 캐릭터 이름 받기 (예: node test-aion2tool.js 캐릭터이름)
      const testCharacter = process.argv[2] || '콕';

      await searchInput.fill(testCharacter);
      console.log(`   ✅ 검색어 입력: "${testCharacter}"\n`);

      // 검색 버튼 찾기
      const searchButtonSelectors = [
        'button[type="submit"]',
        'button:has-text("검색")',
        '.search-button',
        '#search-button'
      ];

      let searchButton = null;
      for (const selector of searchButtonSelectors) {
        try {
          const element = await page.$(selector);
          if (element && await element.isVisible()) {
            console.log(`   ✅ 검색 버튼 발견: ${selector}`);
            searchButton = element;
            break;
          }
        } catch (e) {
          // 선택자가 없으면 다음으로
        }
      }

      if (searchButton) {
        await searchButton.click();
        console.log('   ✅ 검색 버튼 클릭\n');

        // 검색 결과 로딩 대기
        await page.waitForTimeout(3000);

        // 6. 결과 페이지에서 아툴 점수 찾기
        console.log('📄 Step 6: 아툴 점수 찾기');

        const scoreSelectors = [
          '#dps-score-value',
          '#combat-score-value',
          '.combat-score',
          '[class*="atool-score"]',
          '[class*="combat-score"]',
          '[id*="score"]'
        ];

        for (const selector of scoreSelectors) {
          try {
            const element = await page.$(selector);
            if (element && await element.isVisible()) {
              const text = await element.textContent();
              console.log(`   ✅ 점수 발견: ${selector} = "${text}"`);
            }
          } catch (e) {
            // 선택자가 없으면 다음으로
          }
        }

        // 검색 결과 상세 정보 추출
        console.log('\n📄 Step 7: 검색 결과 상세 정보 추출');
        const characterInfo = await page.evaluate(() => {
          const info = {
            nickname: '',
            server: '',
            race: '',
            class: '',
            level: '',
            itemLevel: '',
            atoolScore: '',
            combatScore: '',
            dpsScore: '',
            allText: ''
          };

          // 닉네임
          const nickname = document.querySelector('#result-nickname');
          if (nickname) info.nickname = nickname.textContent.trim();

          // 아툴 점수 관련 요소들 찾기
          const scoreElements = [
            '#atool-score',
            '#combat-score',
            '#dps-score-value',
            '#combat-score-value',
            '[class*="score"]',
            '[id*="score"]'
          ];

          scoreElements.forEach(selector => {
            try {
              const elements = document.querySelectorAll(selector);
              elements.forEach(el => {
                const text = el.textContent.trim();
                if (text && text.length < 100) {
                  if (selector.includes('atool')) info.atoolScore += text + ' ';
                  if (selector.includes('combat')) info.combatScore += text + ' ';
                  if (selector.includes('dps')) info.dpsScore += text + ' ';
                }
              });
            } catch (e) {}
          });

          // 전체 결과 텍스트 (디버깅용)
          const resultContainer = document.querySelector('#character-result') ||
                                 document.querySelector('.hero-card');
          if (resultContainer) {
            info.allText = resultContainer.textContent.substring(0, 1000);
          }

          return info;
        });

        console.log('검색 결과:');
        console.log(JSON.stringify(characterInfo, null, 2));
        console.log('\n');
      } else {
        console.log('   ⚠️  검색 버튼을 찾을 수 없습니다 (Enter 키로 검색 가능할 수도 있음)\n');

        // Enter 키 시도
        await searchInput.press('Enter');
        console.log('   ✅ Enter 키 입력\n');
        await page.waitForTimeout(3000);
      }
    }

    // 7. 전체 페이지 스크린샷 (디버깅용)
    console.log('📄 Step 8: 스크린샷 저장');
    await page.screenshot({
      path: 'F:/region/scripts/aion2tool-screenshot.png',
      fullPage: true
    });
    console.log('   ✅ 스크린샷 저장: scripts/aion2tool-screenshot.png\n');

    // 8. 네트워크 요청 분석
    console.log('📄 Step 9: API 엔드포인트 확인');
    console.log('   (네트워크 요청을 다시 실행해서 확인 필요)\n');

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error(error.stack);
  } finally {
    // 브라우저를 5초 후에 닫음 (수동 확인 시간 제공)
    console.log('⏳ 5초 후 브라우저를 닫습니다...');
    await page.waitForTimeout(5000);
    await browser.close();
  }

  console.log('\n✅ 조사 완료!');
}

// 실행
investigateAion2Tool().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

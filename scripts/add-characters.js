const { createClient } = require('@supabase/supabase-js');

// Supabase 초기화
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 추가할 캐릭터 목록
const characters = [
  '컹',
  'wh',
  '개탱',
  '마동석',
  '호응킹',
  'K모노드라마',
  'hp포션',
  'ss휴휴ss',
  '닝키',
  '닭고기',
  '도녀',
  '동궈',
  '발생유형변경',
  '밥통이',
  '뱃',
  '빠꾸없다',
  '쁅',
  '송하냥',
  '시도리',
  '실바나스',
  '아재힐',
  '예림이',
  '옭',
  '웅웅',
  '이번생도글렀나',
  '쟝첸',
  '찬들',
  '체리향',
  '초니',
  '촤',
  '최후일격',
  '콕',
  '쿵',
  '탤',
  '파남보',
  '흠냐옹'
];

async function main() {
  console.log('🚀 캐릭터 일괄 추가 시작\n');
  console.log(`📋 총 ${characters.length}개 캐릭터 추가 예정\n`);

  let addedCount = 0;
  let skippedCount = 0;

  for (const name of characters) {
    // 중복 체크
    const { data: existing } = await supabase
      .from('characters')
      .select('id')
      .eq('name', name)
      .single();

    if (existing) {
      console.log(`⏭️  "${name}" - 이미 존재함 (건너뜀)`);
      skippedCount++;
      continue;
    }

    // 캐릭터 추가
    const { error } = await supabase
      .from('characters')
      .insert({
        name,
        server: '마족 루미엘',
      });

    if (error) {
      console.error(`❌ "${name}" - 추가 실패:`, error.message);
    } else {
      console.log(`✅ "${name}" - 추가 완료`);
      addedCount++;
    }
  }

  console.log('\n📊 결과:');
  console.log(`   ✅ 추가됨: ${addedCount}개`);
  console.log(`   ⏭️  건너뜀: ${skippedCount}개`);
  console.log(`   📋 총: ${characters.length}개\n`);
}

main().catch(error => {
  console.error('\n❌오류 발생:', error);
  process.exit(1);
});

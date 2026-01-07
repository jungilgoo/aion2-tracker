const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log('🔍 Supabase DPS 데이터 확인\n');

  // 전체 캐릭터 데이터 확인
  const { data: characters, error } = await supabase
    .from('characters')
    .select('id, name, item_level, dps_score')
    .order('item_level', { ascending: false });

  if (error) {
    console.error('❌ 에러:', error);
    return;
  }

  console.log(`총 캐릭터: ${characters.length}명\n`);
  console.log('DPS 점수 현황:');
  console.log('='.repeat(60));

  let withDps = 0;
  let withoutDps = 0;

  characters.forEach(char => {
    const dpsDisplay = char.dps_score ? `✅ ${char.dps_score.toLocaleString()}` : '❌ NULL';
    console.log(`${char.name.padEnd(15)} | 아이템: ${String(char.item_level).padStart(5)} | DPS: ${dpsDisplay}`);

    if (char.dps_score) {
      withDps++;
    } else {
      withoutDps++;
    }
  });

  console.log('='.repeat(60));
  console.log(`\nDPS 점수 있음: ${withDps}명`);
  console.log(`DPS 점수 없음: ${withoutDps}명`);
}

checkData().catch(console.error);

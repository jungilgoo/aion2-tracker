import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import CharacterList from './components/CharacterList';
import AddCharacter from './components/AddCharacter';
import LastUpdate from './components/LastUpdate';

interface Character {
  id: number;
  name: string;
  itemLevel: number | null;
  characterClass: string | null;
  server: string;
  lastUpdated: string | null;
  url: string | null;
  dpsScore: number | null;
  history?: Array<{
    itemLevel: number;
    dpsScore: number | null;
    date: string;
  }>;
}

async function getCharacters(): Promise<Character[]> {
  try {
    // 캐릭터 데이터 가져오기
    const { data: characters, error: charsError } = await supabase
      .from('characters')
      .select('*')
      .order('item_level', { ascending: false, nullsFirst: false });

    if (charsError) {
      logger.error('Error fetching characters:', charsError);
      return [];
    }

    if (!characters || characters.length === 0) {
      return [];
    }

    // 각 캐릭터의 히스토리 가져오기
    const charactersWithHistory = await Promise.all(
      characters.map(async (char) => {
        const { data: history } = await supabase
          .from('character_history')
          .select('item_level, dps_score, date')
          .eq('character_id', char.id)
          .order('date', { ascending: true });

        return {
          id: char.id,
          name: char.name,
          itemLevel: char.item_level,
          characterClass: char.character_class,
          server: char.server,
          lastUpdated: char.last_updated,
          url: char.url,
          dpsScore: char.dps_score,
          history: history?.map(h => ({
            itemLevel: h.item_level,
            dpsScore: h.dps_score,
            date: h.date
          })) || []
        };
      })
    );

    return charactersWithHistory;
  } catch (error) {
    logger.error('Error in getCharacters:', error);
    return [];
  }
}

export default async function Home() {
  const characters = await getCharacters();

  // itemLevel이 문자열로 필요한 경우 변환
  const charactersForDisplay = characters.map(char => ({
    ...char,
    itemLevel: char.itemLevel?.toString() || '',
    characterClass: char.characterClass || '',
    lastUpdated: char.lastUpdated || '',
    url: char.url || '',
    dpsScore: char.dpsScore?.toString() || '',
    history: char.history?.map(h => ({
      itemLevel: h.itemLevel.toString(),
      dpsScore: h.dpsScore?.toString() || '',
      date: h.date
    }))
  }));

  return (
    <main>
      <div className="mb-8">
        <AddCharacter />
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">
          길드원 리스트 ({characters.length})
        </h2>
        <CharacterList characters={charactersForDisplay} />
      </div>

      <LastUpdate lastUpdated={charactersForDisplay[0]?.lastUpdated} />
    </main>
  );
}

// On-Demand Revalidation 사용
// GitHub Actions에서 스크래핑 완료 후 수동으로 캐시 갱신 트리거
// 자동 재검증 비활성화 - 불필요한 DB 쿼리 방지
export const revalidate = false;

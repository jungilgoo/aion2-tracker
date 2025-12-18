import { supabase } from '@/lib/supabase';
import CharacterList from './components/CharacterList';
import AddCharacter from './components/AddCharacter';
import LastUpdate from './components/LastUpdate';

interface Character {
  id: number;
  name: string;
  itemLevel: number | null;
  server: string;
  lastUpdated: string | null;
  url: string | null;
  history?: Array<{
    itemLevel: number;
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
      console.error('Error fetching characters:', charsError);
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
          .select('item_level, date')
          .eq('character_id', char.id)
          .order('date', { ascending: true });

        return {
          id: char.id,
          name: char.name,
          itemLevel: char.item_level,
          server: char.server,
          lastUpdated: char.last_updated,
          url: char.url,
          history: history?.map(h => ({
            itemLevel: h.item_level,
            date: h.date
          })) || []
        };
      })
    );

    return charactersWithHistory;
  } catch (error) {
    console.error('Error in getCharacters:', error);
    return [];
  }
}

export default async function Home() {
  const characters = await getCharacters();

  // itemLevel이 문자열로 필요한 경우 변환
  const charactersForDisplay = characters.map(char => ({
    ...char,
    itemLevel: char.itemLevel?.toString() || '',
    lastUpdated: char.lastUpdated || '',
    url: char.url || '',
    history: char.history?.map(h => ({
      itemLevel: h.itemLevel.toString(),
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

// 항상 최신 데이터 표시 (캐시 비활성화)
export const revalidate = 0;

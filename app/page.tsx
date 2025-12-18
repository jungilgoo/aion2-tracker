import { head } from '@vercel/blob';
import CharacterList from './components/CharacterList';
import AddCharacter from './components/AddCharacter';
import LastUpdate from './components/LastUpdate';

const BLOB_NAME = 'characters-data';

interface Character {
  name: string;
  itemLevel: string;
  server: string;
  lastUpdated: string;
  url: string;
  history?: Array<{
    itemLevel: string;
    date: string;
  }>;
}

interface CharacterData {
  characters: Character[];
}

async function getCharacters(): Promise<CharacterData> {
  try {
    // Blob 존재 여부 확인
    const blobInfo = await head(`${BLOB_NAME}.json`);

    if (!blobInfo || !blobInfo.url) {
      console.log('No blob found, returning empty data');
      return { characters: [] };
    }

    // Blob에서 데이터 읽기 (캐시 무효화 - timestamp로 CDN 캐시 우회)
    const cacheBuster = `?t=${Date.now()}`;
    const response = await fetch(blobInfo.url + cacheBuster, {
      cache: 'no-store',
    });
    const content = await response.text();
    return JSON.parse(content);
  } catch (error) {
    console.log('Error fetching characters:', error);
    return { characters: [] };
  }
}

export default async function Home() {
  const data = await getCharacters();

  return (
    <main>
      <div className="mb-8">
        <AddCharacter />
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">
          추적 중인 캐릭터 ({data.characters.length})
        </h2>
        <CharacterList characters={data.characters} />
      </div>

      <LastUpdate lastUpdated={data.characters[0]?.lastUpdated} />
    </main>
  );
}

// 항상 최신 데이터 표시 (캐시 비활성화)
export const revalidate = 0;

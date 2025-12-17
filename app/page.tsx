import { head } from '@vercel/blob';
import CharacterList from './components/CharacterList';
import AddCharacter from './components/AddCharacter';

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

    if (!blobInfo) {
      return { characters: [] };
    }

    // Blob에서 데이터 읽기
    const response = await fetch(blobInfo.url);
    const content = await response.text();
    return JSON.parse(content);
  } catch (error) {
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

      <div className="mt-8 text-center text-gray-500 text-sm">
        <p>매일 자동으로 업데이트됩니다</p>
        <p className="mt-2">
          마지막 업데이트: {data.characters[0]?.lastUpdated
            ? new Date(data.characters[0].lastUpdated).toLocaleString('ko-KR')
            : '아직 없음'}
        </p>
      </div>
    </main>
  );
}

// Revalidate every hour
export const revalidate = 3600;

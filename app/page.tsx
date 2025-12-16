import { promises as fs } from 'fs';
import path from 'path';
import CharacterList from './components/CharacterList';
import AddCharacter from './components/AddCharacter';

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
    const filePath = path.join(process.cwd(), 'data', 'characters.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    return JSON.parse(fileContents);
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

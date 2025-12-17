import { NextRequest, NextResponse } from 'next/server';
import { put, head } from '@vercel/blob';

const BLOB_NAME = 'characters-data';

interface Character {
  name: string;
  itemLevel?: string;
  server?: string;
  lastUpdated?: string;
  url?: string;
  history?: Array<{
    itemLevel: string;
    date: string;
  }>;
}

interface CharacterData {
  characters: Character[];
}

async function readData(): Promise<CharacterData> {
  try {
    // Blob 존재 여부 확인
    const blobInfo = await head(`${BLOB_NAME}.json`);

    if (!blobInfo || !blobInfo.url) {
      console.log('Blob does not exist, returning empty data');
      return { characters: [] };
    }

    // Blob에서 데이터 읽기
    const response = await fetch(blobInfo.url);
    const content = await response.text();
    return JSON.parse(content);
  } catch (error) {
    // Blob이 없거나 에러 발생 시 빈 배열 반환
    console.log('Error reading blob, returning empty data:', error);
    return { characters: [] };
  }
}

async function writeData(data: CharacterData): Promise<void> {
  // Blob Storage에 JSON 데이터 저장
  await put(`${BLOB_NAME}.json`, JSON.stringify(data, null, 2), {
    access: 'public',
    contentType: 'application/json',
  });
}

// POST - 캐릭터 추가
export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();

    if (!name) {
      return NextResponse.json(
        { message: '캐릭터 이름이 필요합니다' },
        { status: 400 }
      );
    }

    console.log('Adding character:', name);

    const data = await readData();
    console.log('Current data:', data);

    // 중복 체크
    if (data.characters.some((c) => c.name === name)) {
      return NextResponse.json(
        { message: '이미 추가된 캐릭터입니다' },
        { status: 400 }
      );
    }

    // 새 캐릭터 추가
    data.characters.push({
      name,
      server: '마족 루미엘',
    });

    console.log('Saving data to blob...');
    await writeData(data);
    console.log('Data saved successfully');

    return NextResponse.json({ message: '캐릭터가 추가되었습니다' });
  } catch (error) {
    console.error('Error in POST /api/characters:', error);
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다', error: String(error) },
      { status: 500 }
    );
  }
}

// DELETE - 캐릭터 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { name } = await request.json();

    if (!name) {
      return NextResponse.json(
        { message: '캐릭터 이름이 필요합니다' },
        { status: 400 }
      );
    }

    const data = await readData();
    const character = data.characters.find((c) => c.name === name);

    if (!character) {
      return NextResponse.json(
        { message: '캐릭터를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 캐릭터 삭제
    data.characters = data.characters.filter((c) => c.name !== name);
    await writeData(data);

    return NextResponse.json({ message: '캐릭터가 삭제되었습니다' });
  } catch (error) {
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

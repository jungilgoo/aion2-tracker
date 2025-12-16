import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_FILE = path.join(process.cwd(), 'data', 'characters.json');
const PASSWORD_SALT = process.env.PASSWORD_SALT || 'aion2-tracker-salt';

function hashPassword(password: string): string {
  return crypto
    .createHmac('sha256', PASSWORD_SALT)
    .update(password)
    .digest('hex');
}

interface Character {
  name: string;
  itemLevel?: string;
  server?: string;
  lastUpdated?: string;
  url?: string;
  passwordHash: string;
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
    const content = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return { characters: [] };
  }
}

async function writeData(data: CharacterData): Promise<void> {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// POST - 캐릭터 추가
export async function POST(request: NextRequest) {
  try {
    const { name, password } = await request.json();

    if (!name || !password) {
      return NextResponse.json(
        { message: '캐릭터 이름과 비밀번호가 필요합니다' },
        { status: 400 }
      );
    }

    const data = await readData();

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
      passwordHash: hashPassword(password),
      server: '마족 루미엘',
    });

    await writeData(data);

    return NextResponse.json({ message: '캐릭터가 추가되었습니다' });
  } catch (error) {
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// DELETE - 캐릭터 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { name, password } = await request.json();

    if (!name || !password) {
      return NextResponse.json(
        { message: '캐릭터 이름과 비밀번호가 필요합니다' },
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

    // 비밀번호 확인
    if (character.passwordHash !== hashPassword(password)) {
      return NextResponse.json(
        { message: '비밀번호가 일치하지 않습니다' },
        { status: 401 }
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

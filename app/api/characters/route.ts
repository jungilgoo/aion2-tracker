import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

// 비밀번호 해싱 함수
function hashPassword(password: string): string {
  const salt = process.env.PASSWORD_SALT || '';
  return crypto.createHmac('sha256', salt).update(password).digest('hex');
}

// POST - 캐릭터 추가
export async function POST(request: NextRequest) {
  try {
    const { name, password } = await request.json();

    if (!name) {
      return NextResponse.json(
        { message: '캐릭터 이름이 필요합니다' },
        { status: 400 }
      );
    }

    console.log('Adding character:', name);

    // 중복 체크
    const { data: existing } = await supabaseAdmin
      .from('characters')
      .select('id')
      .eq('name', name)
      .single();

    if (existing) {
      return NextResponse.json(
        { message: '이미 추가된 캐릭터입니다' },
        { status: 400 }
      );
    }

    // 비밀번호 해싱 (선택사항)
    const passwordHash = password ? hashPassword(password) : null;

    // 새 캐릭터 추가
    const { error } = await supabaseAdmin
      .from('characters')
      .insert({
        name,
        password_hash: passwordHash,
        server: '마족 루미엘',
      });

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { message: '캐릭터 추가 실패', error: error.message },
        { status: 500 }
      );
    }

    console.log('Character added successfully');

    return NextResponse.json({
      message: '캐릭터가 추가되었습니다. 내일 오전 9시 자동 업데이트 시 아이템 레벨이 수집됩니다.'
    });
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
    const { name, password } = await request.json();

    if (!name) {
      return NextResponse.json(
        { message: '캐릭터 이름이 필요합니다' },
        { status: 400 }
      );
    }

    // 캐릭터 찾기
    const { data: character } = await supabaseAdmin
      .from('characters')
      .select('id, password_hash')
      .eq('name', name)
      .single();

    if (!character) {
      return NextResponse.json(
        { message: '캐릭터를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 비밀번호 검증 (설정되어 있는 경우)
    if (character.password_hash && password) {
      const inputHash = hashPassword(password);
      if (inputHash !== character.password_hash) {
        return NextResponse.json(
          { message: '비밀번호가 일치하지 않습니다' },
          { status: 403 }
        );
      }
    }

    // 캐릭터 삭제 (CASCADE로 히스토리도 자동 삭제됨)
    const { error } = await supabaseAdmin
      .from('characters')
      .delete()
      .eq('id', character.id);

    if (error) {
      console.error('Supabase delete error:', error);
      return NextResponse.json(
        { message: '삭제 실패', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: '캐릭터가 삭제되었습니다' });
  } catch (error) {
    console.error('Error in DELETE /api/characters:', error);
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

// 관리자 비밀번호 검증 함수
function verifyAdminPassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    console.warn('ADMIN_PASSWORD 환경 변수가 설정되지 않았습니다!');
    return false;
  }
  return password === adminPassword;
}

// POST - 캐릭터 추가 (누구나 가능)
export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();

    if (!name) {
      return NextResponse.json(
        { message: '캐릭터 이름이 필요합니다' },
        { status: 400 }
      );
    }

    logger.log('Adding character:', name);

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

    // 새 캐릭터 추가
    const { error } = await supabaseAdmin
      .from('characters')
      .insert({
        name,
        server: '마족 루미엘',
      });

    if (error) {
      logger.error('Supabase insert error:', error);
      return NextResponse.json(
        { message: '캐릭터 추가 실패', error: error.message },
        { status: 500 }
      );
    }

    logger.log('Character added successfully');

    return NextResponse.json({
      message: '캐릭터가 추가되었습니다. 내일 오전 9시 자동 업데이트 시 아이템 레벨이 수집됩니다.'
    });
  } catch (error) {
    logger.error('Error in POST /api/characters:', error);
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다', error: String(error) },
      { status: 500 }
    );
  }
}

// DELETE - 캐릭터 삭제 (관리자 비밀번호 필요)
export async function DELETE(request: NextRequest) {
  try {
    const { name, password } = await request.json();

    if (!name) {
      return NextResponse.json(
        { message: '캐릭터 이름이 필요합니다' },
        { status: 400 }
      );
    }

    // 관리자 비밀번호 검증
    if (!password) {
      return NextResponse.json(
        { message: '관리자 비밀번호가 필요합니다' },
        { status: 403 }
      );
    }

    if (!verifyAdminPassword(password)) {
      return NextResponse.json(
        { message: '관리자 비밀번호가 일치하지 않습니다' },
        { status: 403 }
      );
    }

    // 캐릭터 찾기
    const { data: character } = await supabaseAdmin
      .from('characters')
      .select('id')
      .eq('name', name)
      .single();

    if (!character) {
      return NextResponse.json(
        { message: '캐릭터를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 캐릭터 삭제 (CASCADE로 히스토리도 자동 삭제됨)
    const { error } = await supabaseAdmin
      .from('characters')
      .delete()
      .eq('id', character.id);

    if (error) {
      logger.error('Supabase delete error:', error);
      return NextResponse.json(
        { message: '삭제 실패', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: '캐릭터가 삭제되었습니다' });
  } catch (error) {
    logger.error('Error in DELETE /api/characters:', error);
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

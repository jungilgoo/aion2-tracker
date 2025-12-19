import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/logger';

/**
 * On-Demand Revalidation API
 * GitHub Actions에서 스크래핑 완료 후 호출하여 즉시 캐시 갱신
 */
export async function POST(request: NextRequest) {
  try {
    // URL에서 secret 파라미터 추출
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    // 보안 검증
    if (!secret || secret !== process.env.REVALIDATE_SECRET) {
      logger.error('Revalidation failed: Invalid secret');
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      );
    }

    // 홈페이지 캐시 갱신
    revalidatePath('/');

    logger.log('Page revalidated successfully');

    return NextResponse.json({
      revalidated: true,
      message: '캐시가 갱신되었습니다',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Revalidation error:', error);
    return NextResponse.json(
      {
        message: '캐시 갱신 실패',
        error: String(error)
      },
      { status: 500 }
    );
  }
}

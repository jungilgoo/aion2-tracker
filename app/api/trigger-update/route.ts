import { NextResponse } from 'next/server';

// GitHub 저장소 정보
const GITHUB_OWNER = 'jungilgoo';
const GITHUB_REPO = 'aion2-tracker';
const WORKFLOW_FILE = 'daily-update.yml';

/**
 * GitHub Actions workflow를 수동으로 트리거합니다.
 * POST /api/trigger-update
 */
export async function POST() {
  try {
    const githubToken = process.env.GITHUB_TOKEN;

    if (!githubToken) {
      return NextResponse.json(
        {
          message: 'GitHub Token이 설정되지 않았습니다. 환경 변수를 확인해주세요.',
          error: 'GITHUB_TOKEN 환경 변수가 필요합니다.'
        },
        { status: 500 }
      );
    }

    // GitHub API를 통해 workflow_dispatch 이벤트 트리거
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${WORKFLOW_FILE}/dispatches`;

    console.log('Triggering GitHub workflow:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `Bearer ${githubToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ref: 'main', // 브랜치 이름 (main 또는 master)
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GitHub API error:', errorText);

      return NextResponse.json(
        {
          message: 'GitHub Actions 트리거 실패',
          error: errorText,
          status: response.status
        },
        { status: response.status }
      );
    }

    console.log('Workflow triggered successfully');

    return NextResponse.json({
      message: '업데이트가 시작되었습니다! 1-2분 후 페이지를 새로고침해주세요.',
      success: true
    });

  } catch (error) {
    console.error('Error triggering update:', error);
    return NextResponse.json(
      {
        message: '업데이트 트리거 중 오류가 발생했습니다',
        error: String(error)
      },
      { status: 500 }
    );
  }
}

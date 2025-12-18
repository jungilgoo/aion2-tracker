# AION2 캐릭터 추적기 - 프로젝트 가이드

> AION2 마족 루미엘 서버 캐릭터의 아이템 레벨을 자동으로 추적하는 웹 애플리케이션

---

## ⚠️ 중요: Claude Code 사용 지침

**이 프로젝트에서 작업할 때는 반드시 모든 응답을 한국어로 작성해주세요.**

- 코드 설명, 에러 메시지, 가이드 등 모든 커뮤니케이션을 한국어로 진행
- 주석(comments)도 한국어로 작성
- 커밋 메시지도 한국어로 작성

---

## 프로젝트 개요

### 기술 스택
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS
- **Scraping**: Playwright (Chromium)
- **Deployment**: Vercel
- **CI/CD**: GitHub Actions
- **Data Storage**: Vercel Blob Storage (클라우드 파일 저장소)

### 주요 기능
- ✅ 캐릭터 추가/삭제 (비밀번호 보호)
- ✅ 매일 자동 업데이트 (GitHub Actions)
- ✅ 수동 업데이트 (웹 UI 버튼으로 즉시 업데이트)
- ✅ 아이템 레벨 변화 추적 및 표시
- ✅ 히스토리 관리 (최근 30일)
- ✅ 반응형 UI

## 프로젝트 구조

```
F:\region\
├── app/                          # Next.js 14 App Directory
│   ├── api/
│   │   ├── characters/
│   │   │   └── route.ts         # API 엔드포인트 (POST: 추가, DELETE: 삭제)
│   │   └── trigger-update/
│   │       └── route.ts         # 수동 업데이트 트리거 API
│   ├── components/
│   │   ├── AddCharacter.tsx     # 캐릭터 추가 폼 컴포넌트
│   │   ├── CharacterList.tsx    # 캐릭터 목록 및 삭제 컴포넌트
│   │   ├── LastUpdate.tsx       # 마지막 업데이트 시간 표시
│   │   └── ManualUpdateButton.tsx # 수동 업데이트 버튼 컴포넌트
│   ├── layout.tsx               # 루트 레이아웃 (메타데이터, 글로벌 스타일)
│   └── page.tsx                 # 메인 페이지 (서버 컴포넌트)
├── data/
│   └── characters.json          # 캐릭터 데이터 저장소
├── scripts/
│   └── scrape.js                # Playwright 스크래핑 스크립트
├── .github/
│   └── workflows/
│       └── daily-update.yml     # 매일 자동 업데이트 워크플로우
├── .env                         # 환경 변수 (PASSWORD_SALT)
├── .env.example                 # 환경 변수 예시
├── DEPLOYMENT.md                # 배포 가이드
└── package.json                 # 프로젝트 의존성
```

## 핵심 컴포넌트 설명

### 1. API Route (`app/api/characters/route.ts`)
**기능**: 캐릭터 추가/삭제 API
- **POST**: 새 캐릭터 추가
  - 입력: `{ name, password }`
  - 비밀번호는 HMAC SHA-256으로 해싱
  - 중복 캐릭터 체크
- **DELETE**: 캐릭터 삭제
  - 입력: `{ name, password }`
  - 비밀번호 검증 후 삭제

### 2. 스크래핑 스크립트 (`scripts/scrape.js`)
**기능**: AION2 공식 사이트에서 캐릭터 정보 수집
- Playwright Chromium 사용
- 검색 URL 직접 구성: `race=2`, `serverId=2004` (마족 루미엘)
- 8초 대기로 React 앱 로딩 보장
- 정확한 캐릭터 이름 매칭
- 아이템 레벨 추출 및 히스토리 관리
- 최근 30일 히스토리만 유지

### 3. GitHub Actions (`daily-update.yml`)
**기능**: 매일 자동 업데이트
- 스케줄: UTC 00:00 (한국 시간 09:00)
- Playwright 브라우저 자동 설치
- 스크래핑 실행 → 데이터 커밋 → Git Push

## 데이터 구조

### `characters.json`
```json
{
  "characters": [
    {
      "name": "캐릭터이름",
      "passwordHash": "해시된비밀번호",
      "server": "마족 루미엘",
      "itemLevel": "2829",
      "lastUpdated": "2025-12-16T05:23:48.602Z",
      "url": "https://aion2.plaync.com/...",
      "history": [
        {
          "itemLevel": "2829",
          "date": "2025-12-16T05:23:48.602Z"
        }
      ]
    }
  ]
}
```

## 개발 워크플로우

### 로컬 개발
```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
# → http://localhost:3000

# 스크래핑 테스트
npm run scrape

# 빌드 테스트
npm run build
npm start
```

### 환경 변수 설정
`.env` 파일 (로컬 개발용):
```bash
PASSWORD_SALT=your-secret-salt-here
GITHUB_TOKEN=ghp_your_github_personal_access_token_here
# BLOB_READ_WRITE_TOKEN은 로컬 개발 시 필요 없음
```

**Vercel 환경 변수 (프로덕션):**
- `PASSWORD_SALT`: 수동 설정 필요
- `GITHUB_TOKEN`: GitHub Personal Access Token (수동 업데이트용)
- `BLOB_READ_WRITE_TOKEN`: Blob Storage 생성 시 자동 설정

**GitHub Secrets (Actions용):**
- `BLOB_READ_WRITE_TOKEN`: Vercel에서 복사해서 수동 추가

**GitHub Token 생성 방법:**
1. https://github.com/settings/tokens/new 접속
2. Note: "AION2 Tracker Manual Update" 입력
3. Expiration: 원하는 기간 선택 (권장: No expiration)
4. Scopes: `public_repo` 또는 `repo` 선택
5. Generate token 클릭 후 복사
6. Vercel 환경 변수에 `GITHUB_TOKEN`으로 추가

## 배포 프로세스

### Vercel 배포
1. GitHub에 코드 푸시
2. Vercel에서 프로젝트 Import
3. Environment Variables 설정: `PASSWORD_SALT`
4. 자동 배포 완료

### GitHub Actions 활성화
저장소 Settings → Actions → General:
- "Allow all actions and reusable workflows" 선택
- "Read and write permissions" 선택

## 사용 방법

### 캐릭터 추가
1. 웹 페이지 접속
2. 캐릭터 이름 입력 (마족 루미엘 서버)
3. 비밀번호 설정 (삭제 시 필요)
4. "추가" 버튼 클릭

### 캐릭터 삭제
1. 캐릭터 카드의 "삭제" 버튼 클릭
2. 설정했던 비밀번호 입력
3. "삭제" 확인

### 자동 업데이트
- 매일 오전 9시 자동 실행
- GitHub Actions에서 수동 실행 가능

### 수동 업데이트
1. 웹 페이지에서 "🔄 지금 업데이트" 버튼 클릭
2. 1-2분 대기 (GitHub Actions 실행)
3. 자동으로 페이지 새로고침 (또는 수동 새로고침)
4. 모든 캐릭터 정보 최신화 완료

**참고**: 수동 업데이트는 GitHub Token이 필요하며, Vercel 환경 변수에 설정되어 있어야 합니다.

## 보안 고려사항

### 비밀번호 보호
- HMAC SHA-256 해싱 사용
- `PASSWORD_SALT` 환경 변수로 보안 강화
- 비밀번호는 저장하지 않고 해시만 저장

### 데이터 관리
- **Vercel Blob Storage** 사용
  - Serverless 환경에서 파일 저장 가능
  - 자동 스케일링 및 고가용성
  - 무료 티어 제공 (1GB 저장소, 100GB 대역폭)
- JSON 형식으로 캐릭터 데이터 저장
- 히스토리는 30일로 제한하여 용량 관리
- 읽기 전용 파일 시스템 문제 해결

## 주의사항

### 스크래핑 윤리
- 서버 부하 방지: 요청 간 2초 대기
- 교육 목적으로만 사용
- AION2 이용약관 준수

### 기술적 제약
- 마족 루미엘 서버만 지원 (race=2, serverId=2004)
- 비밀번호 분실 시 복구 불가
- 캐릭터가 존재하지 않으면 스크래핑 실패

## 트러블슈팅

### GitHub Actions 실패
- Actions 탭에서 로그 확인
- Playwright 설치: `npx playwright install --with-deps chromium`

### 스크래핑 오류
- 캐릭터 이름 정확성 확인
- 서버 선택 확인 (마족 루미엘)
- `data/characters.json` 파일 권한 확인

### 배포 문제
- Vercel 로그 확인
- `PASSWORD_SALT` 환경 변수 설정 확인
- Build Command: `npm run build`

## 향후 개선 사항 아이디어

- [ ] 다른 서버 지원 (천족, 다른 서버)
- [ ] 데이터베이스 연동 (PostgreSQL, MongoDB)
- [ ] 그래프로 아이템 레벨 변화 시각화
- [ ] 알림 기능 (아이템 레벨 변화 시 Discord/Slack 알림)
- [ ] 여러 캐릭터 비교 기능
- [ ] 관리자 페이지
- [ ] 비밀번호 재설정 기능

## 라이선스
MIT

## 기여
이슈 및 풀 리퀘스트 환영합니다!

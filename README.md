# AION2 캐릭터 추적기

마족 루미엘 서버 캐릭터의 아이템 레벨을 자동으로 추적하는 웹 애플리케이션입니다.

## 기능

- ✅ 캐릭터 추가/삭제 (비밀번호 보호)
- ✅ 매일 자동 업데이트 (GitHub Actions)
- ✅ 아이템 레벨 변화 추적
- ✅ 히스토리 관리 (최근 30일)
- ✅ Vercel 배포 지원

## 시작하기

### 1. 저장소 클론

```bash
git clone <your-repo-url>
cd aion2-character-tracker
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정

`.env.example`을 `.env`로 복사하고 값을 수정하세요:

```bash
cp .env.example .env
```

### 4. 로컬 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000`을 열어 확인하세요.

### 5. 수동 스크래핑 테스트

```bash
npm run scrape
```

## Vercel 배포

### 1. GitHub에 푸시

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Vercel에서 프로젝트 Import

1. [Vercel](https://vercel.com)에 로그인
2. "Add New Project" 클릭
3. GitHub 저장소 선택
4. Environment Variables에 `PASSWORD_SALT` 추가
5. Deploy 클릭

### 3. GitHub Actions 활성화

저장소의 Settings > Actions > General에서 다음을 허용:

- "Allow all actions and reusable workflows"
- "Read and write permissions" (Workflow permissions)

## 사용 방법

1. **캐릭터 추가**
   - 캐릭터 이름과 비밀번호 입력
   - "추가" 버튼 클릭
   - 마족 루미엘 서버의 캐릭터만 가능

2. **캐릭터 삭제**
   - 캐릭터 카드의 "삭제" 버튼 클릭
   - 추가할 때 설정한 비밀번호 입력

3. **자동 업데이트**
   - 매일 자동으로 실행됩니다
   - GitHub Actions에서 수동 실행도 가능

## 기술 스택

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Scraping**: Playwright
- **Deployment**: Vercel
- **CI/CD**: GitHub Actions
- **Data Storage**: JSON file (Git으로 관리)

## 프로젝트 구조

```
├── app/                    # Next.js 14 App Directory
│   ├── api/                # API Routes
│   ├── components/         # React Components
│   ├── layout.tsx          # Root Layout
│   └── page.tsx            # Home Page
├── data/                   # Data Storage
│   └── characters.json     # Character Data
├── scripts/                # Utility Scripts
│   └── scrape.js           # Playwright Scraper
├── .github/
│   └── workflows/
│       └── daily-update.yml # GitHub Actions
└── package.json
```

## 라이선스

MIT

## 주의사항

- 이 프로젝트는 교육 목적으로 만들어졌습니다
- AION2 공식 서비스의 이용약관을 준수하세요
- 과도한 요청으로 서버에 부하를 주지 마세요

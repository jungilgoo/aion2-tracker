# 배포 가이드

## 1. GitHub 저장소 생성 및 푸시

```bash
# Git 초기화 (아직 안 했다면)
git init

# 모든 파일 추가
git add .

# 첫 커밋
git commit -m "Initial commit: AION2 캐릭터 추적기"

# GitHub에서 새 저장소 생성 후
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/aion2-tracker.git
git push -u origin main
```

## 2. Vercel 배포

### 방법 1: Vercel CLI 사용
```bash
npm install -g vercel
vercel login
vercel
```

### 방법 2: Vercel 웹 인터페이스
1. [vercel.com](https://vercel.com) 접속 및 로그인
2. "Add New Project" 클릭
3. GitHub 저장소 선택
4. Environment Variables 설정:
   - `PASSWORD_SALT`: 랜덤한 문자열 (예: `your-secret-salt-change-this`)
5. Deploy 클릭

## 3. GitHub Actions 설정

저장소 Settings에서:
1. **Actions > General**
   - "Allow all actions and reusable workflows" 선택
   
2. **Actions > General > Workflow permissions**
   - "Read and write permissions" 선택
   - "Allow GitHub Actions to create and approve pull requests" 체크

## 4. 테스트

### 로컬 테스트
```bash
# 개발 서버 실행
npm run dev

# 스크래핑 테스트
npm run scrape
```

### GitHub Actions 수동 실행
1. 저장소의 Actions 탭으로 이동
2. "Daily Character Update" 워크플로우 선택
3. "Run workflow" 클릭

## 5. 사용 방법

1. **캐릭터 추가**
   - 웹 페이지에서 캐릭터 이름과 비밀번호 입력
   - "추가" 버튼 클릭

2. **자동 업데이트**
   - 매일 자동으로 실행됩니다 (UTC 00:00 = KST 09:00)
   - GitHub Actions에서 수동 실행도 가능

3. **캐릭터 삭제**
   - 삭제하려는 캐릭터의 "삭제" 버튼 클릭
   - 추가할 때 설정한 비밀번호 입력

## 주의사항

- 마족 루미엘 서버의 캐릭터만 추적 가능
- 비밀번호는 해시화되어 저장되므로 분실 시 복구 불가
- 과도한 스크래핑은 서버에 부담을 줄 수 있으니 주의

## 문제 해결

### GitHub Actions 실패
- Actions 탭에서 로그 확인
- Playwright 설치 문제일 경우: 워크플로우에 `npx playwright install --with-deps chromium` 추가됨

### 배포 실패
- Vercel 로그 확인
- Environment Variables 확인
- Build Command가 `npm run build`인지 확인

### 스크래핑 실패
- `data/characters.json` 파일 확인
- 캐릭터 이름이 정확한지 확인
- 로그에서 오류 메시지 확인

# Vercel Blob Storage 설정 가이드

## 📌 개요

Vercel Blob Storage를 사용하여 serverless 환경에서 캐릭터 데이터를 저장합니다.
이 가이드를 따라 설정을 완료하세요.

---

## 1️⃣ Vercel에서 Blob Storage 생성

### 단계별 설정

1. **Vercel 프로젝트 대시보드 접속**
   - https://vercel.com 로그인
   - 배포된 프로젝트 선택 (aion2-tracker)

2. **Storage 탭으로 이동**
   - 상단 메뉴에서 **Storage** 클릭

3. **Blob Storage 생성**
   - **"Create Database"** 또는 **"Connect Store"** 버튼 클릭
   - **"Blob"** 선택
   - Database Name 입력: `aion2-characters` (또는 원하는 이름)
   - **Create** 버튼 클릭

4. **자동 환경 변수 생성 확인**
   - 생성 완료 후 자동으로 `BLOB_READ_WRITE_TOKEN` 환경 변수가 추가됨
   - Settings → Environment Variables에서 확인 가능

---

## 2️⃣ GitHub Secrets 설정 (GitHub Actions용)

스크래핑 스크립트가 GitHub Actions에서 실행될 때 Blob Storage에 접근하려면 토큰이 필요합니다.

### 토큰 가져오기

1. **Vercel 프로젝트에서 토큰 복사**
   - Vercel 프로젝트 → **Settings** → **Environment Variables**
   - `BLOB_READ_WRITE_TOKEN` 값 옆의 **"눈"** 아이콘 클릭 (값 표시)
   - 전체 토큰 값 복사 (예: `vercel_blob_rw_...`)

### GitHub에 Secret 추가

2. **GitHub 저장소 설정**
   - GitHub 저장소 페이지로 이동
   - **Settings** → **Secrets and variables** → **Actions**
   - **"New repository secret"** 버튼 클릭

3. **Secret 추가**
   - **Name**: `BLOB_READ_WRITE_TOKEN`
   - **Secret**: 복사한 토큰 값 붙여넣기
   - **Add secret** 클릭

---

## 3️⃣ 배포 및 테스트

### 코드 배포

```bash
# 변경사항 커밋
git add .
git commit -m "✨ Vercel Blob Storage 마이그레이션"
git push origin main
```

### Vercel 자동 배포 확인

1. Vercel 대시보드에서 배포 상태 확인
2. 배포 완료 후 사이트 접속: https://aion2-tracker.vercel.app
3. 캐릭터 추가 기능 테스트

### GitHub Actions 테스트

1. **GitHub 저장소** → **Actions** 탭
2. **"Daily Character Update"** 워크플로우 선택
3. **"Run workflow"** → **"Run workflow"** 버튼 클릭
4. 실행 결과 확인 (성공 시 ✅ 표시)

---

## 4️⃣ 확인 사항

### ✅ 체크리스트

- [ ] Vercel에서 Blob Storage가 생성되었나요?
- [ ] `BLOB_READ_WRITE_TOKEN` 환경 변수가 Vercel Settings에 있나요?
- [ ] GitHub Secrets에 `BLOB_READ_WRITE_TOKEN`이 추가되었나요?
- [ ] 코드가 GitHub에 푸시되었나요?
- [ ] Vercel 배포가 성공했나요?
- [ ] 웹사이트에서 캐릭터 추가가 정상 작동하나요?
- [ ] GitHub Actions가 정상 실행되나요?

---

## 🔧 문제 해결

### 문제 1: 캐릭터 추가 시 500 에러

**원인**: Blob Storage가 생성되지 않았거나 환경 변수가 없음

**해결책**:
1. Vercel → Storage 탭에서 Blob Storage 확인
2. Settings → Environment Variables에서 `BLOB_READ_WRITE_TOKEN` 확인
3. 없으면 Blob Storage 재생성

### 문제 2: GitHub Actions 실패

**원인**: GitHub Secret이 설정되지 않음

**해결책**:
1. GitHub → Settings → Secrets and variables → Actions
2. `BLOB_READ_WRITE_TOKEN` Secret 확인
3. 없으면 Vercel에서 토큰 복사 후 추가

### 문제 3: 데이터가 표시되지 않음

**원인**: 기존 데이터가 Blob Storage로 마이그레이션되지 않음

**해결책**:
1. 웹사이트에서 캐릭터 새로 추가
2. 또는 로컬에서 스크래핑 실행:
   ```bash
   # .env 파일에 BLOB_READ_WRITE_TOKEN 추가 필요
   npm run scrape
   ```

---

## 📊 Blob Storage 사용량 확인

### 무료 티어 제한
- **저장 용량**: 1GB
- **대역폭**: 100GB/월

### 사용량 확인
1. Vercel → Storage → Blob 선택
2. Usage 탭에서 현재 사용량 확인

---

## 💡 추가 정보

### Blob Storage vs 파일 시스템

**이전 (파일 시스템)**:
- ❌ Vercel serverless에서 쓰기 불가 (read-only)
- ❌ 배포마다 데이터 초기화
- ✅ 간단한 구조

**현재 (Blob Storage)**:
- ✅ Serverless에서 읽기/쓰기 가능
- ✅ 데이터 영구 저장
- ✅ 자동 스케일링
- ✅ 고가용성

### 데이터 백업

Blob Storage의 데이터는 Vercel에서 자동 관리되지만, 추가 백업이 필요하면:
1. Vercel Blob UI에서 수동 다운로드
2. 또는 스크립트로 정기적 백업 구현

---

## ✅ 완료!

설정이 완료되면 다음과 같이 동작합니다:

1. **웹에서 캐릭터 추가** → Blob Storage에 저장
2. **매일 자동 스크래핑** → Blob Storage 업데이트
3. **웹에서 조회** → Blob Storage에서 데이터 로드

문제가 있으면 Vercel 로그와 GitHub Actions 로그를 확인하세요!

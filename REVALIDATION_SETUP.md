# On-Demand Revalidation 설정 가이드

## 개요
매일 오전 9시 GitHub Actions가 스크래핑을 완료하면 **즉시** Vercel 캐시를 갱신하여 모든 사용자가 최신 데이터를 확인할 수 있습니다.

## 환경 변수 설정

### 1. Vercel 환경 변수 설정

Vercel Dashboard → Your Project → Settings → Environment Variables

| 변수명 | 값 | 설명 |
|--------|-----|------|
| `REVALIDATE_SECRET` | `랜덤 문자열` | 캐시 갱신 API 보안 키 |

**REVALIDATE_SECRET 생성 방법:**
```bash
# 안전한 랜덤 문자열 생성
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. GitHub Secrets 설정

GitHub Repository → Settings → Secrets and variables → Actions → New repository secret

| Secret 이름 | 값 | 설명 |
|--------------|-----|------|
| `VERCEL_URL` | `https://your-app.vercel.app` | Vercel 배포 URL |
| `REVALIDATE_SECRET` | Vercel과 **동일한 값** | 캐시 갱신 API 보안 키 |

**⚠️ 중요:** `REVALIDATE_SECRET`은 Vercel과 GitHub에 **동일한 값**을 입력해야 합니다!

### 3. 기존 환경 변수 확인

다음 Secrets가 이미 설정되어 있는지 확인하세요:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## 동작 흐름

```
09:00 - ⏰ GitHub Actions 시작 (스케줄 트리거)
  ↓
09:01 - 🔍 Playwright로 캐릭터 스크래핑
  ↓
09:02 - 💾 Supabase에 새 데이터 저장
  ↓
09:02 - 🚀 Vercel API 호출 (/api/revalidate)
  ↓
09:02 - ♻️ Vercel 캐시 즉시 갱신
  ↓
09:03 - ✅ 모든 사용자가 최신 데이터 확인
```

## 수동으로 캐시 갱신하기

필요 시 수동으로 캐시를 갱신할 수 있습니다:

```bash
curl -X POST "https://your-app.vercel.app/api/revalidate?secret=YOUR_SECRET_HERE"
```

**응답 예시:**
```json
{
  "revalidated": true,
  "message": "캐시가 갱신되었습니다",
  "timestamp": "2025-12-19T09:02:35.123Z"
}
```

## 문제 해결

### 1. Revalidation 실패 (401 Unauthorized)
**원인:** REVALIDATE_SECRET이 일치하지 않음
**해결:** Vercel과 GitHub Secrets의 값이 동일한지 확인

### 2. Revalidation 실패 (500 Internal Server Error)
**원인:** Vercel 배포 오류
**해결:** Vercel 로그 확인

### 3. GitHub Actions에서 "VERCEL_URL not set" 에러
**원인:** GitHub Secrets에 VERCEL_URL 미설정
**해결:** Secrets에 Vercel 배포 URL 추가

## 확인 방법

GitHub Actions → Actions 탭 → Daily Character Update 워크플로우 확인

성공 시 로그:
```
✅ Revalidation successful!
```

실패 시 로그:
```
❌ Revalidation failed!
HTTP Status: 401
```

## 장점

- ✅ **즉시 반영**: 오전 9시 스크래핑 완료 후 1초 안에 새 데이터 반영
- ✅ **DB 쿼리 최소화**: 불필요한 재검증 0번
- ✅ **초고속 로딩**: 모든 사용자가 캐시된 정적 페이지 확인
- ✅ **비용 절감**: Supabase 읽기 요청 최소화

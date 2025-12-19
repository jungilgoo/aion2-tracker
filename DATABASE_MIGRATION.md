# Supabase 데이터베이스 마이그레이션 가이드

## 클래스 정보 추가 (character_class 컬럼)

### 1. Supabase SQL Editor에서 실행

Supabase Dashboard → SQL Editor → New query

```sql
-- characters 테이블에 character_class 컬럼 추가
ALTER TABLE characters
ADD COLUMN character_class TEXT;

-- 인덱스 추가 (선택사항, 검색 성능 향상)
CREATE INDEX idx_characters_class ON characters(character_class);
```

### 2. 실행 확인

```sql
-- 테이블 구조 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'characters'
ORDER BY ordinal_position;
```

**예상 결과:**
```
id              | bigint  | NO
name            | text    | NO
password_hash   | text    | YES
server          | text    | YES
item_level      | integer | YES
character_class | text    | YES  ← 새로 추가됨
last_updated    | timestamp | YES
url             | text    | YES
created_at      | timestamp | YES
```

### 3. 기존 데이터 처리

기존 캐릭터들의 `character_class`는 `NULL`로 설정됩니다.
다음번 스크래핑(오전 9시 또는 수동 실행)에서 자동으로 클래스 정보가 채워집니다.

### 롤백 (필요시)

```sql
-- character_class 컬럼 제거 (롤백)
ALTER TABLE characters
DROP COLUMN character_class;
```

## 완료 체크리스트

- [ ] SQL 실행 완료
- [ ] 테이블 구조 확인
- [ ] 코드 배포 완료
- [ ] GitHub Actions 실행하여 데이터 수집 확인

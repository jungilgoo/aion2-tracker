# Supabase 데이터베이스 마이그레이션 가이드

## 1단계: 테이블 생성 (최초 1회)

Supabase Dashboard → SQL Editor → New query

### 테이블 생성 SQL

```sql
-- characters 테이블 생성
CREATE TABLE IF NOT EXISTS characters (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  server TEXT DEFAULT '마족 루미엘',
  item_level INTEGER,
  character_class TEXT,
  last_updated TIMESTAMP WITH TIME ZONE,
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- character_history 테이블 생성
CREATE TABLE IF NOT EXISTS character_history (
  id BIGSERIAL PRIMARY KEY,
  character_id BIGINT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  item_level INTEGER NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_characters_name ON characters(name);
CREATE INDEX IF NOT EXISTS idx_characters_class ON characters(character_class);
CREATE INDEX IF NOT EXISTS idx_characters_item_level ON characters(item_level DESC);
CREATE INDEX IF NOT EXISTS idx_history_character_id ON character_history(character_id);
CREATE INDEX IF NOT EXISTS idx_history_date ON character_history(date DESC);

-- Row Level Security (RLS) 설정
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_history ENABLE ROW LEVEL SECURITY;

-- 읽기 권한 (모든 사용자)
CREATE POLICY "Anyone can read characters"
  ON characters FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can read character_history"
  ON character_history FOR SELECT
  TO anon, authenticated
  USING (true);

-- 쓰기 권한 (서버 측 서비스 역할만)
CREATE POLICY "Service role can insert characters"
  ON characters FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update characters"
  ON characters FOR UPDATE
  TO service_role
  USING (true);

CREATE POLICY "Service role can delete characters"
  ON characters FOR DELETE
  TO service_role
  USING (true);

CREATE POLICY "Service role can insert character_history"
  ON character_history FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can delete character_history"
  ON character_history FOR DELETE
  TO service_role
  USING (true);
```

## 2단계: 실행 확인

```sql
-- 테이블 생성 확인
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('characters', 'character_history');

-- characters 테이블 구조 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'characters'
ORDER BY ordinal_position;
```

**예상 결과 (characters):**
```
id              | bigint    | NO  | nextval(...)
name            | text      | NO  | NULL
password_hash   | text      | YES | NULL
server          | text      | YES | '마족 루미엘'
item_level      | integer   | YES | NULL
character_class | text      | YES | NULL
last_updated    | timestamp | YES | NULL
url             | text      | YES | NULL
created_at      | timestamp | YES | now()
```

## 3단계: RLS 정책 확인

```sql
-- Row Level Security 정책 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename IN ('characters', 'character_history');
```

## 완료 체크리스트

- [ ] 테이블 생성 SQL 실행 완료
- [ ] 테이블 및 컬럼 확인
- [ ] RLS 정책 확인
- [ ] 코드 배포 완료
- [ ] GitHub Actions 실행하여 데이터 수집 확인

## 문제 해결

### "relation already exists" 에러
```sql
-- 테이블이 이미 존재하는 경우 (정상)
-- IF NOT EXISTS 옵션으로 안전하게 처리됨
```

### 기존 데이터 마이그레이션
기존에 Blob Storage를 사용했다면 데이터가 없으므로 처음부터 시작합니다.
웹 UI에서 캐릭터를 추가하고 GitHub Actions를 실행하면 자동으로 데이터가 수집됩니다.

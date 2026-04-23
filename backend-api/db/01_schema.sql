-- Nakamal app schema
-- Run this script in your Render PostgreSQL database.

BEGIN;

CREATE TABLE IF NOT EXISTS nakamals (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  google_maps_link TEXT,
  opening_time TIME,
  closing_time TIME,
  alcohol_available BOOLEAN,
  kakai_available BOOLEAN,
  kava_windows_count INTEGER CHECK (kava_windows_count IS NULL OR kava_windows_count >= 0),
  rate NUMERIC(2,1) CHECK (rate IS NULL OR (rate >= 0 AND rate <= 5)),
  status VARCHAR(20) NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'pending', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nakamal_comments (
  id BIGSERIAL PRIMARY KEY,
  nakamal_id BIGINT NOT NULL REFERENCES nakamals(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL DEFAULT 'Anonymous',
  comment_text TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'pending', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nakamal_photos (
  id BIGSERIAL PRIMARY KEY,
  nakamal_id BIGINT NOT NULL REFERENCES nakamals(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'pending', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nakamals_status ON nakamals(status);
CREATE INDEX IF NOT EXISTS idx_nakamal_comments_nakamal_id ON nakamal_comments(nakamal_id);
CREATE INDEX IF NOT EXISTS idx_nakamal_comments_status ON nakamal_comments(status);
CREATE INDEX IF NOT EXISTS idx_nakamal_photos_nakamal_id ON nakamal_photos(nakamal_id);
CREATE INDEX IF NOT EXISTS idx_nakamal_photos_status ON nakamal_photos(status);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_updated_at_nakamals ON nakamals;

CREATE TRIGGER trg_set_updated_at_nakamals
BEFORE UPDATE ON nakamals
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

COMMIT;

CREATE TABLE links (
    id           SERIAL PRIMARY KEY,
    code         VARCHAR(32) NOT NULL UNIQUE,
    original_url TEXT        NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    clicks       INTEGER     NOT NULL DEFAULT 0,
    CONSTRAINT links_code_format CHECK (code ~ '^[A-Za-z0-9_-]{3,32}$'),
    CONSTRAINT links_clicks_nonneg CHECK (clicks >= 0)
);
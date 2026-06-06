CREATE TABLE IF NOT EXISTS posts (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  published_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  category TEXT NOT NULL,
  reading_minutes INTEGER NOT NULL DEFAULT 4,
  noindex INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS food_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  maker TEXT,
  category TEXT,
  report_no TEXT,
  serving_basis TEXT,
  kcal_per_100g REAL,
  protein_per_100kcal REAL,
  sugar_per_100g REAL,
  sodium_per_100g REAL,
  saturated_fat_per_100g REAL,
  source_name TEXT NOT NULL,
  source_updated_at TEXT
);

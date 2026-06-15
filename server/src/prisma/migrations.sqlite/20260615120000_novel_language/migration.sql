-- Additive: Novel.language locale column (zh default).
-- Locale source for novel-scoped prompts (chapter/world/character/director).
-- No data loss; existing rows default to 'zh'.
ALTER TABLE "Novel" ADD COLUMN "language" TEXT NOT NULL DEFAULT 'zh';

-- Additive: NovelStoryMode.language locale column (zh default).
-- Lets story-mode seeds carry a language when English seeds are authored
-- (the existing 31 zh seeds stay zh; English seeds are a separate content
-- effort, not this migration). No data loss; existing rows default to 'zh'.
ALTER TABLE "NovelStoryMode" ADD COLUMN "language" TEXT NOT NULL DEFAULT 'zh';

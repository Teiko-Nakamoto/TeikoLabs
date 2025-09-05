-- Migration: Remove legacy points_per_correct_answer from quizzes
-- Run this in Supabase SQL editor

ALTER TABLE IF EXISTS quizzes
DROP COLUMN IF EXISTS points_per_correct_answer;

-- Optional: remove any related comments if they exist (safe even if absent)
COMMENT ON COLUMN quizzes.points_per_correct_answer IS NULL;



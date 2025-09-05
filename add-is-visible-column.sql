-- Add is_visible column to quizzes table
-- This column will control whether quizzes are visible to users

ALTER TABLE quizzes 
ADD COLUMN is_visible BOOLEAN DEFAULT true;

-- Update existing quizzes to be visible by default
UPDATE quizzes 
SET is_visible = true 
WHERE is_visible IS NULL;

-- Add a comment to document the column
COMMENT ON COLUMN quizzes.is_visible IS 'Controls whether the quiz is visible to users. Default is true.';

-- Optional: Create an index for better performance when filtering by visibility
CREATE INDEX IF NOT EXISTS idx_quizzes_is_visible ON quizzes(is_visible);


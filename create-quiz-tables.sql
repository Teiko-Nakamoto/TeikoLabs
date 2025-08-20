-- Quiz System Database Schema
-- Run this in your Supabase SQL Editor

-- Create quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    max_questions INTEGER DEFAULT 6,
    points_per_correct_answer DECIMAL(10,2) DEFAULT 3.5,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create quiz_questions table
CREATE TABLE IF NOT EXISTS quiz_questions (
    id SERIAL PRIMARY KEY,
    quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    wrong_answer1 TEXT NOT NULL,
    wrong_answer2 TEXT NOT NULL,
    wrong_answer3 TEXT NOT NULL,
    question_order INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create user_points table
CREATE TABLE IF NOT EXISTS user_points (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(255) NOT NULL UNIQUE,
    total_points INTEGER DEFAULT 0,
    perfect_quizzes INTEGER DEFAULT 0,
    total_quizzes_attempted INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create quiz_attempts table
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id SERIAL PRIMARY KEY,
    quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
    wallet_address VARCHAR(255) NOT NULL,
    score INTEGER DEFAULT 0,
    questions_answered INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create quiz_settings table for competition settings
DROP TABLE IF EXISTS quiz_settings CASCADE;
CREATE TABLE quiz_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(255) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create sbtc_fee_pool_history table to track fee pool changes
CREATE TABLE IF NOT EXISTS sbtc_fee_pool_history (
    id SERIAL PRIMARY KEY,
    fee_pool_amount BIGINT NOT NULL,
    previous_amount BIGINT,
    change_amount BIGINT,
    change_percentage DECIMAL(10,4),
    calculated_reward INTEGER NOT NULL,
    reward_calculation JSONB,
    blockchain_timestamp TIMESTAMP,
    recorded_at TIMESTAMP DEFAULT NOW()
);

-- Insert default competition settings
INSERT INTO quiz_settings (setting_key, setting_value) VALUES
    ('competition_active', 'true'),
    ('total_points_earned', '0'),
    ('competition_end_threshold', '21000000'),
    ('quiz_completion_points', '21');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_wallet ON quiz_attempts(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_points_wallet ON user_points(wallet_address);
CREATE INDEX IF NOT EXISTS idx_sbtc_fee_pool_history_timestamp ON sbtc_fee_pool_history(recorded_at);

-- Enable Row Level Security (RLS)
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sbtc_fee_pool_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to quizzes" ON quizzes;
DROP POLICY IF EXISTS "Allow public read access to quiz_questions" ON quiz_questions;
DROP POLICY IF EXISTS "Allow public read access to user_points" ON user_points;
DROP POLICY IF EXISTS "Allow public read access to quiz_attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Allow public read access to quiz_settings" ON quiz_settings;
DROP POLICY IF EXISTS "Allow public read access to sbtc_fee_pool_history" ON sbtc_fee_pool_history;

-- Create policies for public read access
CREATE POLICY "Allow public read access to quizzes" ON quizzes
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to quiz_questions" ON quiz_questions
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to user_points" ON user_points
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to quiz_attempts" ON quiz_attempts
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to quiz_settings" ON quiz_settings
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to sbtc_fee_pool_history" ON sbtc_fee_pool_history
    FOR SELECT USING (true);

-- Drop existing authenticated policies if they exist
DROP POLICY IF EXISTS "Allow authenticated insert to quiz_attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Allow authenticated update to quiz_attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Allow authenticated insert to user_points" ON user_points;
DROP POLICY IF EXISTS "Allow authenticated update to user_points" ON user_points;
DROP POLICY IF EXISTS "Allow authenticated insert to sbtc_fee_pool_history" ON sbtc_fee_pool_history;

-- Create policies for authenticated insert/update
CREATE POLICY "Allow authenticated insert to quiz_attempts" ON quiz_attempts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated update to quiz_attempts" ON quiz_attempts
    FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated insert to user_points" ON user_points
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated update to user_points" ON user_points
    FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated insert to sbtc_fee_pool_history" ON sbtc_fee_pool_history
    FOR INSERT WITH CHECK (true);

-- Drop existing admin policies if they exist
DROP POLICY IF EXISTS "Allow admin access to all tables" ON quizzes;
DROP POLICY IF EXISTS "Allow admin access to all tables" ON quiz_questions;
DROP POLICY IF EXISTS "Allow admin access to all tables" ON user_points;
DROP POLICY IF EXISTS "Allow admin access to all tables" ON quiz_attempts;
DROP POLICY IF EXISTS "Allow admin access to all tables" ON quiz_settings;
DROP POLICY IF EXISTS "Allow admin access to all tables" ON sbtc_fee_pool_history;

-- Create policies for admin access (you can modify these based on your admin requirements)
CREATE POLICY "Allow admin access to all tables" ON quizzes
    FOR ALL USING (true);

CREATE POLICY "Allow admin access to all tables" ON quiz_questions
    FOR ALL USING (true);

CREATE POLICY "Allow admin access to all tables" ON user_points
    FOR ALL USING (true);

CREATE POLICY "Allow admin access to all tables" ON quiz_attempts
    FOR ALL USING (true);

CREATE POLICY "Allow admin access to all tables" ON quiz_settings
    FOR ALL USING (true);

CREATE POLICY "Allow admin access to all tables" ON sbtc_fee_pool_history
    FOR ALL USING (true);

-- Verify tables were created
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('quizzes', 'quiz_questions', 'user_points', 'quiz_attempts', 'quiz_settings', 'sbtc_fee_pool_history')
ORDER BY table_name, ordinal_position;

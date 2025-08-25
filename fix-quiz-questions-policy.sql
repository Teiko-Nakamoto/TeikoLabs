-- Fix missing INSERT policy for quiz_questions table
-- Run this in your Supabase SQL Editor

-- Drop existing policies for quiz_questions if they exist
DROP POLICY IF EXISTS "Allow authenticated insert to quiz_questions" ON quiz_questions;
DROP POLICY IF EXISTS "Allow public insert to quiz_questions" ON quiz_questions;

-- Create INSERT policy for quiz_questions
CREATE POLICY "Allow authenticated insert to quiz_questions" ON quiz_questions
    FOR INSERT WITH CHECK (true);

-- Also create a public INSERT policy as fallback
CREATE POLICY "Allow public insert to quiz_questions" ON quiz_questions
    FOR INSERT WITH CHECK (true);

-- Verify the policy was created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'quiz_questions';

-- Add symbol column to existing token_cards table
-- Run this in your Supabase SQL editor

ALTER TABLE token_cards
ADD COLUMN symbol TEXT; 
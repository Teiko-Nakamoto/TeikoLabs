-- Add all missing columns to existing token_cards table
-- Run this in your Supabase SQL editor

-- Add symbol column
ALTER TABLE token_cards
ADD COLUMN IF NOT EXISTS symbol TEXT;

-- Add revenue column  
ALTER TABLE token_cards
ADD COLUMN IF NOT EXISTS revenue TEXT;

-- Add liquidity column
ALTER TABLE token_cards
ADD COLUMN IF NOT EXISTS liquidity TEXT;

-- Add tab_type column if it doesn't exist
ALTER TABLE token_cards
ADD COLUMN IF NOT EXISTS tab_type TEXT DEFAULT 'featured' CHECK (tab_type IN ('featured', 'practice')); 
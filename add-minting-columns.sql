-- Add minting completion tracking to user_tokens table
-- Run this in Supabase SQL Editor

-- 1. Add minting completion tracking columns
ALTER TABLE user_tokens 
ADD COLUMN IF NOT EXISTS minting_completed BOOLEAN DEFAULT FALSE;

ALTER TABLE user_tokens 
ADD COLUMN IF NOT EXISTS minting_tx_hash VARCHAR(255);

ALTER TABLE user_tokens 
ADD COLUMN IF NOT EXISTS minting_completed_at TIMESTAMP WITH TIME ZONE;

-- 2. Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_tokens_minting_completed ON user_tokens(minting_completed);

-- 3. Add comment for documentation
COMMENT ON COLUMN user_tokens.minting_completed IS 'Whether the token supply has been minted to the DEX contract';
COMMENT ON COLUMN user_tokens.minting_tx_hash IS 'Transaction hash when minting was completed';
COMMENT ON COLUMN user_tokens.minting_completed_at IS 'Timestamp when minting was completed';

-- 4. Update token_cards table constraint to allow new tab_type values
ALTER TABLE token_cards 
DROP CONSTRAINT IF EXISTS valid_tab_type;

ALTER TABLE token_cards 
ADD CONSTRAINT valid_tab_type 
CHECK (tab_type IN ('featured', 'practice', 'user_created_mainnet', 'user_created_testnet'));

-- 5. Add comment for token_cards tab_type
COMMENT ON COLUMN token_cards.tab_type IS 'Tab assignment: featured, practice, user_created_mainnet, user_created_testnet';
-- Run this in Supabase SQL Editor

-- 1. Add minting completion tracking columns
ALTER TABLE user_tokens 
ADD COLUMN IF NOT EXISTS minting_completed BOOLEAN DEFAULT FALSE;

ALTER TABLE user_tokens 
ADD COLUMN IF NOT EXISTS minting_tx_hash VARCHAR(255);

ALTER TABLE user_tokens 
ADD COLUMN IF NOT EXISTS minting_completed_at TIMESTAMP WITH TIME ZONE;

-- 2. Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_tokens_minting_completed ON user_tokens(minting_completed);

-- 3. Add comment for documentation
COMMENT ON COLUMN user_tokens.minting_completed IS 'Whether the token supply has been minted to the DEX contract';
COMMENT ON COLUMN user_tokens.minting_tx_hash IS 'Transaction hash when minting was completed';
COMMENT ON COLUMN user_tokens.minting_completed_at IS 'Timestamp when minting was completed';

-- 4. Update token_cards table constraint to allow new tab_type values
ALTER TABLE token_cards 
DROP CONSTRAINT IF EXISTS valid_tab_type;

ALTER TABLE token_cards 
ADD CONSTRAINT valid_tab_type 
CHECK (tab_type IN ('featured', 'practice', 'user_created_mainnet', 'user_created_testnet'));

-- 5. Add comment for token_cards tab_type
COMMENT ON COLUMN token_cards.tab_type IS 'Tab assignment: featured, practice, user_created_mainnet, user_created_testnet';

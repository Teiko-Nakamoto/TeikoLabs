-- Remove unnecessary minting columns - keep only minting_completed
-- Run this in Supabase SQL Editor

-- Remove the extra minting columns we don't need
ALTER TABLE user_tokens 
DROP COLUMN IF EXISTS minting_tx_hash;

ALTER TABLE user_tokens 
DROP COLUMN IF EXISTS minting_completed_at;

-- Update comment for the remaining column
COMMENT ON COLUMN user_tokens.minting_completed IS 'Whether the token supply has been minted to the DEX contract (boolean only)';
-- Run this in Supabase SQL Editor

-- Remove the extra minting columns we don't need
ALTER TABLE user_tokens 
DROP COLUMN IF EXISTS minting_tx_hash;

ALTER TABLE user_tokens 
DROP COLUMN IF EXISTS minting_completed_at;

-- Update comment for the remaining column
COMMENT ON COLUMN user_tokens.minting_completed IS 'Whether the token supply has been minted to the DEX contract (boolean only)';

-- Add missing network column to existing user_tokens table
ALTER TABLE user_tokens 
ADD COLUMN IF NOT EXISTS network VARCHAR(20) DEFAULT 'testnet';

-- Add comment for the new column
COMMENT ON COLUMN user_tokens.network IS 'The network where the token was deployed (testnet/mainnet)';

-- Update any existing records to have 'testnet' as default
UPDATE user_tokens 
SET network = 'testnet' 
WHERE network IS NULL;

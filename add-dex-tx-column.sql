-- Add DEX transaction hash column to user_tokens table
-- This will store the transaction ID for when the DEX contract is deployed

ALTER TABLE user_tokens 
ADD COLUMN IF NOT EXISTS dex_deployment_tx_hash VARCHAR(255);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_user_tokens_dex_tx_hash ON user_tokens(dex_deployment_tx_hash);

-- Add comment for documentation
COMMENT ON COLUMN user_tokens.dex_deployment_tx_hash IS 'The transaction hash of the DEX contract deployment';

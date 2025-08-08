-- Safe fix for user_tokens table - handles existing objects

-- 1. Add missing columns (only if they don't exist)
ALTER TABLE user_tokens 
ADD COLUMN IF NOT EXISTS network VARCHAR(20) DEFAULT 'testnet';

ALTER TABLE user_tokens 
ADD COLUMN IF NOT EXISTS token_description TEXT;

ALTER TABLE user_tokens 
ADD COLUMN IF NOT EXISTS creator_signature TEXT;

ALTER TABLE user_tokens 
ADD COLUMN IF NOT EXISTS deployment_message TEXT;

ALTER TABLE user_tokens 
ADD COLUMN IF NOT EXISTS initial_supply DECIMAL(20,8) DEFAULT 2100000000000000;

ALTER TABLE user_tokens 
ADD COLUMN IF NOT EXISTS initial_price DECIMAL(20,8) DEFAULT 0.00000001;

ALTER TABLE user_tokens 
ADD COLUMN IF NOT EXISTS trading_fee_percentage DECIMAL(5,2) DEFAULT 2.00;

ALTER TABLE user_tokens 
ADD COLUMN IF NOT EXISTS deployment_status VARCHAR(50) DEFAULT 'pending';

ALTER TABLE user_tokens 
ADD COLUMN IF NOT EXISTS deployment_tx_hash VARCHAR(255);

ALTER TABLE user_tokens 
ADD COLUMN IF NOT EXISTS deployment_block_number BIGINT;

ALTER TABLE user_tokens 
ADD COLUMN IF NOT EXISTS deployed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE user_tokens 
ADD COLUMN IF NOT EXISTS token_logo_url TEXT;

ALTER TABLE user_tokens 
ADD COLUMN IF NOT EXISTS website_url TEXT;

ALTER TABLE user_tokens 
ADD COLUMN IF NOT EXISTS social_links JSONB;

ALTER TABLE user_tokens 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE user_tokens 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Create indexes (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_user_tokens_creator_wallet ON user_tokens(creator_wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_tokens_deployment_status ON user_tokens(deployment_status);
CREATE INDEX IF NOT EXISTS idx_user_tokens_network ON user_tokens(network);
CREATE INDEX IF NOT EXISTS idx_user_tokens_created_at ON user_tokens(created_at);

-- 3. Create or replace the update function (safe)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. Drop existing trigger if it exists, then recreate
DROP TRIGGER IF EXISTS update_user_tokens_updated_at ON user_tokens;

CREATE TRIGGER update_user_tokens_updated_at 
    BEFORE UPDATE ON user_tokens 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Update any existing records with defaults
UPDATE user_tokens 
SET network = 'testnet' 
WHERE network IS NULL;

UPDATE user_tokens 
SET deployment_status = 'pending' 
WHERE deployment_status IS NULL;

UPDATE user_tokens 
SET initial_supply = 2100000000000000 
WHERE initial_supply IS NULL;

UPDATE user_tokens 
SET initial_price = 0.00000001 
WHERE initial_price IS NULL;

UPDATE user_tokens 
SET trading_fee_percentage = 2.00 
WHERE trading_fee_percentage IS NULL;

-- 6. Add comments
COMMENT ON TABLE user_tokens IS 'Stores information about user-created tokens on the blockchain';
COMMENT ON COLUMN user_tokens.token_contract_address IS 'The deployed smart contract address for the token';
COMMENT ON COLUMN user_tokens.dex_contract_address IS 'The DEX/treasury contract address for the token';
COMMENT ON COLUMN user_tokens.creator_wallet_address IS 'The wallet address that created the token';
COMMENT ON COLUMN user_tokens.deployment_tx_hash IS 'The transaction hash of the deployment';
COMMENT ON COLUMN user_tokens.network IS 'The network where the token was deployed (testnet/mainnet)';

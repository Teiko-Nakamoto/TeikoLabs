-- User Tokens Table Schema
-- This table stores information about user-created tokens

CREATE TABLE IF NOT EXISTS user_tokens (
    id SERIAL PRIMARY KEY,
    token_name VARCHAR(255) NOT NULL,
    token_symbol VARCHAR(10) NOT NULL,
    token_description TEXT,
    token_contract_address VARCHAR(255) UNIQUE NOT NULL,
    dex_contract_address VARCHAR(255) UNIQUE NOT NULL,
    creator_wallet_address VARCHAR(255) NOT NULL,
    creator_signature TEXT,
    deployment_message TEXT,
    initial_supply DECIMAL(20,8) NOT NULL,
    initial_price DECIMAL(20,8) DEFAULT 0.00000001,
    trading_fee_percentage DECIMAL(5,2) DEFAULT 2.00,
    deployment_status VARCHAR(50) DEFAULT 'pending',
    deployment_tx_hash VARCHAR(255),
    deployment_block_number BIGINT,
    deployed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    token_logo_url TEXT,
    website_url TEXT,
    social_links JSONB,
    network VARCHAR(20) DEFAULT 'testnet',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_tokens_creator_wallet ON user_tokens(creator_wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_tokens_deployment_status ON user_tokens(deployment_status);
CREATE INDEX IF NOT EXISTS idx_user_tokens_network ON user_tokens(network);
CREATE INDEX IF NOT EXISTS idx_user_tokens_created_at ON user_tokens(created_at);

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_tokens_updated_at 
    BEFORE UPDATE ON user_tokens 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE user_tokens IS 'Stores information about user-created tokens on the blockchain';
COMMENT ON COLUMN user_tokens.token_contract_address IS 'The deployed smart contract address for the token';
COMMENT ON COLUMN user_tokens.dex_contract_address IS 'The DEX/treasury contract address for the token';
COMMENT ON COLUMN user_tokens.creator_wallet_address IS 'The wallet address that created the token';
COMMENT ON COLUMN user_tokens.deployment_tx_hash IS 'The transaction hash of the deployment';
COMMENT ON COLUMN user_tokens.network IS 'The network where the token was deployed (testnet/mainnet)';

# User Tokens System

## Overview

The User Tokens System allows users to create and deploy their own tokens on the Stacks blockchain. When a user successfully deploys a token contract and DEX contract, the system automatically stores the token information in the database for trading.

## Database Schema

### `user_tokens` Table

| Field | Type | Description |
|-------|------|-------------|
| `id` | SERIAL | Primary key |
| `token_name` | VARCHAR(255) | Human-readable token name |
| `token_symbol` | VARCHAR(50) | Token symbol (e.g., "BTC", "ETH") |
| `token_description` | TEXT | Optional token description |
| `token_contract_address` | VARCHAR(255) | Stacks contract address for the token |
| `dex_contract_address` | VARCHAR(255) | Stacks contract address for the DEX |
| `creator_wallet_address` | VARCHAR(255) | Wallet address of token creator |
| `creator_signature` | VARCHAR(255) | Cryptographic signature for verification |
| `deployment_message` | TEXT | Message that was signed |
| `initial_supply` | DECIMAL(30,8) | Initial token supply |
| `initial_price` | DECIMAL(20,8) | Initial token price in SBTC |
| `trading_fee_percentage` | DECIMAL(5,2) | Trading fee percentage |
| `deployment_status` | VARCHAR(50) | Status: 'pending', 'deployed', 'failed' |
| `deployment_tx_hash` | VARCHAR(255) | Transaction hash of deployment |
| `deployment_block_number` | INTEGER | Block number of deployment |
| `is_verified` | BOOLEAN | Whether token has been verified |
| `verification_date` | TIMESTAMP | When token was verified |
| `verified_by_wallet` | VARCHAR(255) | Wallet that verified the token |
| `token_logo_url` | VARCHAR(500) | URL to token logo |
| `website_url` | VARCHAR(500) | Token website URL |
| `social_links` | JSONB | Social media links |
| `created_at` | TIMESTAMP | When record was created |
| `updated_at` | TIMESTAMP | When record was last updated |
| `deployed_at` | TIMESTAMP | When token was deployed |

## API Endpoints

### 1. Create User Token
**POST** `/api/user-tokens/create`

Creates a new user token record when deployment is successful.

**Request Body:**
```json
{
  "tokenName": "My Token",
  "tokenSymbol": "MTK",
  "tokenDescription": "A great token",
  "tokenContractAddress": "ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.my-token",
  "dexContractAddress": "ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.my-dex",
  "creatorWalletAddress": "ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT",
  "creatorSignature": "hex_signature_here",
  "deploymentMessage": "Deploying My Token with initial supply of 1000000",
  "initialSupply": 1000000.00000000,
  "initialPrice": 0.00000001,
  "tradingFeePercentage": 2.00,
  "deploymentTxHash": "0x123...",
  "deploymentBlockNumber": 12345,
  "tokenLogoUrl": "https://example.com/logo.png",
  "websiteUrl": "https://example.com",
  "socialLinks": {
    "twitter": "https://twitter.com/mytoken",
    "telegram": "https://t.me/mytoken"
  }
}
```

**Response:**
```json
{
  "success": true,
  "token": {
    "id": 1,
    "tokenName": "My Token",
    "tokenSymbol": "MTK",
    "tokenContractAddress": "ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.my-token",
    "dexContractAddress": "ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.my-dex",
    "creatorWalletAddress": "ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT",
    "deploymentStatus": "deployed",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### 2. List User Tokens
**GET** `/api/user-tokens/list`

Lists all user tokens with pagination and filtering.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `status` (string): Filter by deployment status
- `verified` (boolean): Filter by verification status
- `creator` (string): Filter by creator wallet address
- `search` (string): Search in name, symbol, or description

**Response:**
```json
{
  "success": true,
  "tokens": [
    {
      "id": 1,
      "tokenName": "My Token",
      "tokenSymbol": "MTK",
      "tokenDescription": "A great token",
      "tokenContractAddress": "ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.my-token",
      "dexContractAddress": "ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.my-dex",
      "creatorWalletAddress": "ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT",
      "initialSupply": 1000000.00000000,
      "initialPrice": 0.00000001,
      "tradingFeePercentage": 2.00,
      "deploymentStatus": "deployed",
      "deploymentTxHash": "0x123...",
      "deploymentBlockNumber": 12345,
      "isVerified": false,
      "tokenLogoUrl": "https://example.com/logo.png",
      "websiteUrl": "https://example.com",
      "socialLinks": {
        "twitter": "https://twitter.com/mytoken",
        "telegram": "https://t.me/mytoken"
      },
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z",
      "deployedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalCount": 1,
    "hasNextPage": false,
    "hasPrevPage": false,
    "limit": 20
  }
}
```

### 3. Get Specific User Token
**GET** `/api/user-tokens/[tokenId]`

Gets a specific user token by ID.

**Response:**
```json
{
  "success": true,
  "token": {
    "id": 1,
    "tokenName": "My Token",
    "tokenSymbol": "MTK",
    // ... all token fields
  }
}
```

### 4. Update User Token
**PUT** `/api/user-tokens/[tokenId]`

Updates a user token (limited fields).

**Request Body:**
```json
{
  "deploymentStatus": "deployed",
  "deploymentTxHash": "0x123...",
  "deploymentBlockNumber": 12345,
  "isVerified": true,
  "verificationDate": "2024-01-01T00:00:00Z",
  "verifiedByWallet": "ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT",
  "tokenLogoUrl": "https://example.com/logo.png",
  "websiteUrl": "https://example.com",
  "socialLinks": {
    "twitter": "https://twitter.com/mytoken"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token updated successfully",
  "token": {
    "id": 1,
    "tokenName": "My Token",
    "tokenSymbol": "MTK",
    "deploymentStatus": "deployed",
    "isVerified": true,
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

## Security Features

### Signature Verification
All token creation requests require a cryptographic signature from the creator's wallet to prevent unauthorized token creation.

### Duplicate Prevention
The system prevents duplicate token and DEX contract addresses.

### Admin Verification
Tokens can be marked as verified by admin wallets for additional trust.

## Setup Instructions

### 1. Create Database Table
```bash
npm run setup-user-tokens
```

Or manually run the SQL in `user-tokens-schema.sql` in your Supabase dashboard.

### 2. Test API Endpoints
```bash
npm run test-user-tokens
```

### 3. Environment Variables
Ensure your `.env.local` has:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Integration Flow

1. **User creates token** through the UI
2. **Wallet signs deployment message** for verification
3. **Contracts are deployed** on Stacks blockchain
4. **API endpoint is called** with deployment details and signature
5. **Token is stored** in database
6. **Token becomes available** for trading

## Next Steps

1. **Create Token Creation UI** - Form for users to input token details
2. **Wallet Integration** - Connect with Stacks wallet for signing
3. **Contract Deployment** - Integrate with Stacks deployment
4. **Token Verification System** - Admin panel for verifying tokens
5. **User Token Dashboard** - Management interface for creators

## Error Handling

The API includes comprehensive error handling for:
- Missing required fields
- Invalid signatures
- Duplicate contract addresses
- Database errors
- Network issues

All errors return appropriate HTTP status codes and descriptive error messages.

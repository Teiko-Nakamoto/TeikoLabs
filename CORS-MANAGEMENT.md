# 🛡️ Dynamic CORS Management System

## Overview

The Dynamic CORS Management System provides secure, wallet-signature-verified control over which domains can access your APIs. This system replaces static CORS configuration with a database-driven whitelist that requires admin wallet signatures for any changes.

## 🔐 Security Features

### Wallet Signature Verification
- **Double Authentication**: Requires both admin authentication AND wallet signature for CORS changes
- **Unique Challenges**: Each CORS operation generates a unique challenge message
- **Signature Validation**: Uses Stacks encryption to verify wallet signatures
- **Audit Trail**: All CORS changes are logged with admin wallet and signature

### Database-Driven Whitelist
- **Dynamic Updates**: No server restarts required for CORS changes
- **Real-time Enforcement**: CORS checks happen on every request
- **Persistent Storage**: All whitelist entries stored in Supabase database

## 📋 Database Schema

### cors_whitelist Table
```sql
CREATE TABLE IF NOT EXISTS cors_whitelist (
  id SERIAL PRIMARY KEY,
  url VARCHAR(255) NOT NULL UNIQUE,
  admin_wallet VARCHAR(100) NOT NULL,
  signature TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Fields:**
- `id`: Unique identifier
- `url`: Domain URL (e.g., https://example.com)
- `admin_wallet`: Admin wallet address that added the URL
- `signature`: Wallet signature for the CORS URL addition
- `message`: Original message that was signed
- `created_at`: Timestamp when URL was added
- `updated_at`: Timestamp of last update

## 🚀 Setup Instructions

### 1. Create Database Table
Run the setup script:
```bash
node setup-cors-table.js
```

Or manually execute the SQL in your Supabase dashboard:
```sql
-- Copy the contents of cors-table-schema.sql
```

### 2. Environment Variables
Ensure these are set in your `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_ADMIN_ADDRESSES=ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4
```

### 3. Apply CORS to API Routes
Wrap your API handlers with the CORS middleware:

```javascript
import { withCors } from '../../utils/corsMiddleware';

async function handler(request) {
  // Your API logic here
}

export const GET = withCors(handler);
export const POST = withCors(handler);
```

## 🔧 API Endpoints

### Get CORS Whitelist
```
GET /api/get-cors-whitelist
```
**Headers:** `Authorization: Bearer {admin_auth_token}`
**Response:** List of all whitelisted domains

### Add CORS URL
```
POST /api/add-cors-url
```
**Headers:** `Authorization: Bearer {admin_auth_token}`
**Body:**
```json
{
  "url": "https://example.com",
  "signature": "wallet_signature",
  "message": "signed_challenge_message"
}
```

### Remove CORS URL
```
POST /api/remove-cors-url
```
**Headers:** `Authorization: Bearer {admin_auth_token}`
**Body:**
```json
{
  "id": 123,
  "signature": "wallet_signature",
  "message": "signed_challenge_message"
}
```

## 🎛️ Admin Panel Usage

### Adding a Domain
1. Navigate to Admin → API Management
2. Enter the domain URL (e.g., `https://example.com`)
3. Click "Add URL"
4. Sign the challenge message with your admin wallet
5. Domain is added to whitelist

### Removing a Domain
1. Find the domain in the whitelist
2. Click the trash icon (🗑️)
3. Confirm the removal
4. Sign the challenge message with your admin wallet
5. Domain is removed from whitelist

## 🔍 How It Works

### 1. CORS Check Flow
```
Request → CORS Middleware → Database Check → Allow/Deny
```

### 2. Adding URL Flow
```
Admin Input → Generate Challenge → Wallet Sign → Verify → Database Insert
```

### 3. Removing URL Flow
```
Admin Select → Generate Challenge → Wallet Sign → Verify → Database Delete
```

## 🛡️ Security Considerations

### Challenge Messages
Each CORS operation generates a unique challenge:
```
Add CORS URL Challenge

URL: https://example.com
Nonce: abc123
Timestamp: 1703123456789
Wallet: ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4

Sign this message to add this URL to the CORS whitelist.
```

### Validation
- **URL Format**: Validates proper URL structure
- **Duplicate Check**: Prevents duplicate entries
- **Admin Verification**: Ensures only admin wallets can modify
- **Signature Verification**: Validates wallet signatures

## 🧪 Testing

### Test CORS Enforcement
```bash
# Test from allowed domain
curl -H "Origin: https://example.com" https://your-api.com/api/current-price

# Test from disallowed domain
curl -H "Origin: https://malicious.com" https://your-api.com/api/current-price
```

### Test Admin Operations
1. Log into admin panel
2. Add a test domain
3. Verify it appears in whitelist
4. Remove the test domain
5. Verify it's removed

## 🚨 Troubleshooting

### Common Issues

**"Origin not allowed" Error**
- Check if domain is in whitelist
- Verify URL format (include protocol)
- Check database connection

**"Invalid signature" Error**
- Ensure wallet is connected
- Check if challenge message is correct
- Verify admin wallet address

**Database Connection Issues**
- Check Supabase credentials
- Verify table exists
- Check network connectivity

### Debug Mode
Enable debug logging by setting:
```bash
DEBUG_CORS=true
```

## 📈 Performance

### Caching
- Database queries are optimized with indexes
- CORS checks are fast and efficient
- No impact on API response times

### Scalability
- Supports unlimited whitelist entries
- Database-driven for easy scaling
- No server restarts required

## 🔄 Migration from Static CORS

If migrating from static CORS configuration:

1. **Backup existing CORS settings**
2. **Add domains to whitelist via admin panel**
3. **Update API routes to use `withCors` wrapper**
4. **Test thoroughly**
5. **Remove old CORS configuration**

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review server logs
3. Verify database connectivity
4. Test with a simple domain first

---

**🛡️ Security Note**: This system provides enterprise-grade CORS security with wallet-based authentication. Always test thoroughly in development before deploying to production.

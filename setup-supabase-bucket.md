# Setting up Supabase Storage Bucket for MAS Token Metadata

## Current Status ✅
Your MAS token metadata has been successfully created and is available at:
- **Local URI**: `/mas-token-metadata.json` (served by your Next.js app)
- **File Location**: `public/mas-token-metadata.json`

## Option 1: Use Local URI (Recommended for now)
Your token metadata is already accessible at `https://yourdomain.com/mas-token-metadata.json` when your app is deployed.

## Option 2: Create Supabase Storage Bucket (For external hosting)

### Step 1: Access Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project: `yivwcilvhtswlmdcjpqw`
3. Navigate to **Storage** in the left sidebar

### Step 2: Create Bucket
1. Click **"New bucket"**
2. Enter bucket name: `uri`
3. Set bucket as **Public**
4. Click **"Create bucket"**

### Step 3: Upload Metadata
1. Click on the `uri` bucket
2. Click **"Upload file"**
3. Select your `mas-token-metadata.json` file
4. Upload the file

### Step 4: Get Public URL
After upload, you'll get a URL like:
```
https://yivwcilvhtswlmdcjpqw.supabase.co/storage/v1/object/public/uri/mas-token-metadata.json
```

### Step 5: Update Token Cards
Once you have the Supabase URL, update your `token_cards_updated.json`:

```json
{
  "metadataUri": "https://yivwcilvhtswlmdcjpqw.supabase.co/storage/v1/object/public/uri/mas-token-metadata.json"
}
```

## Current Token Data
Your MAS token is now configured with:
- **Symbol**: MAS
- **Image**: `/icons/The Mas Network.svg`
- **Metadata URI**: `/mas-token-metadata.json`
- **Contract**: `SP1T0VY3DNXRVP6HBM75DFWW0199CR0X15PC1D81B.mas-sats`

## Next Steps
1. ✅ Metadata file created
2. ✅ Token cards updated
3. 🔄 Update your database with `token_cards_updated.json`
4. 🔄 Deploy your app to make the URI publicly accessible
5. 🔄 (Optional) Set up Supabase bucket for external hosting

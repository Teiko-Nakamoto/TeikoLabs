# Adding Metadata URI to MAS Token on Blockchain

## 🎯 **Your Token Contract Details**
- **Contract Address**: `SP1T0VY3DNXRVP6HBM75DFWW0199CR0X15PC1D81B`
- **Contract Name**: `mas-sats`
- **Full Contract ID**: `SP1T0VY3DNXRVP6HBM75DFWW0199CR0X15PC1D81B.mas-sats`
- **Network**: Mainnet

## 📋 **Steps to Add URI to Blockchain**

### **Step 1: Deploy Your App First**
Before the URI works on the blockchain, you need to deploy your app:

1. **Deploy to Vercel/Netlify** or your preferred hosting
2. **Get your domain** (e.g., `https://yourdomain.com`)
3. **Verify the metadata is accessible** at: `https://yourdomain.com/mas-token-metadata.json`

### **Step 2: Update Token Contract with URI**

You have two options to add the URI to your token contract:

#### **Option A: Using Stacks CLI (Recommended)**
```bash
# Install Stacks CLI if you haven't already
npm install -g @stacks/cli

# Set your private key
export STX_PRIVATE_KEY="your_private_key_here"

# Call the contract function to set metadata URI
stx call-contract \
  --contract-address SP1T0VY3DNXRVP6HBM75DFWW0199CR0X15PC1D81B \
  --contract-name mas-sats \
  --function-name set-token-uri \
  --arg "https://yourdomain.com/mas-token-metadata.json" \
  --network mainnet
```

#### **Option B: Using Hiro Wallet**
1. Open Hiro Wallet
2. Go to **Deploy Contract** or **Contract Call**
3. Enter contract address: `SP1T0VY3DNXRVP6HBM75DFWW0199CR0X15PC1D81B.mas-sats`
4. Call function: `set-token-uri`
5. Parameter: `https://yourdomain.com/mas-token-metadata.json`

### **Step 3: Verify on Blockchain**

Once you've added the URI, verify it on:

1. **Stacks Explorer**: https://explorer.stacks.co/txid/[your-transaction-id]
2. **Hiro Explorer**: https://explorer.hiro.so/txid/[your-transaction-id]
3. **Your wallet**: Should now show token metadata and image

## 🔍 **How to Check if URI is Set**

### **Check via API**
```bash
curl "https://api.hiro.so/extended/v1/address/SP1T0VY3DNXRVP6HBM75DFWW0199CR0X15PC1D81B/balances"
```

### **Check via Explorer**
1. Go to https://explorer.stacks.co
2. Search for: `SP1T0VY3DNXRVP6HBM75DFWW0199CR0X15PC1D81B.mas-sats`
3. Look for the token metadata URI

## 📝 **Contract Function Requirements**

Your token contract should have a function like this:

```clarity
(define-public (set-token-uri (uri (string-utf8 256)))
  (ok (var-set token-uri uri))
)
```

If your contract doesn't have this function, you'll need to:
1. **Deploy a new version** of your contract with the URI function
2. **Or use a different approach** to set metadata

## 🚀 **Quick Test**

Once you've added the URI:

1. **Visit your metadata URL**: `https://yourdomain.com/mas-token-metadata.json`
2. **Check your wallet**: Should show MAS token with image
3. **Check explorers**: Should display token metadata

## ⚠️ **Important Notes**

- **Make sure your app is deployed** before setting the URI
- **Use the full HTTPS URL** in the contract (not relative path)
- **Test the metadata URL** in your browser first
- **Keep your private key secure** when using CLI

## 🎉 **Expected Result**

After adding the URI, your MAS token should appear in:
- ✅ Wallets with proper image and metadata
- ✅ Blockchain explorers with token details
- ✅ DEX platforms with token information
- ✅ Any app that reads token metadata

## 📞 **Need Help?**

If you need help with the contract call or deployment:
1. Check your contract has the `set-token-uri` function
2. Verify your app is deployed and accessible
3. Test the metadata URL in your browser first

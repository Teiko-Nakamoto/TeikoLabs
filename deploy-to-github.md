# Deploy MAS Token Metadata to GitHub Pages

## 🎯 **Your Domain**: teikolabs.com

## 📋 **Steps to Deploy**

### **Step 1: Create GitHub Repository**
1. Go to [GitHub](https://github.com)
2. Create a new repository named: `mas-token-metadata`
3. Make it **Public** (required for GitHub Pages)

### **Step 2: Upload Files**
Upload these files to your repository:

**File Structure:**
```
mas-token-metadata/
├── index.html (redirect to metadata)
├── mas-token-metadata.json
└── icons/
    └── The Mas Network.svg
```

### **Step 3: Enable GitHub Pages**
1. Go to repository **Settings**
2. Scroll to **Pages** section
3. Set **Source** to **Deploy from a branch**
4. Select **main** branch
5. Set folder to **/(root)**
6. Click **Save**

### **Step 4: Configure Custom Domain**
1. In **Pages** settings, add custom domain: `teikolabs.com`
2. Check **Enforce HTTPS**
3. Add CNAME file to repository root:
   ```
   teikolabs.com
   ```

## 🔗 **Your Full URI**

Once deployed, your MAS token metadata URI will be:

```
https://teikolabs.com/mas-token-metadata.json
```

## 📝 **Files to Create**

### **index.html** (redirect)
```html
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="refresh" content="0; url=mas-token-metadata.json">
    <title>MAS Token Metadata</title>
</head>
<body>
    <p>Redirecting to <a href="mas-token-metadata.json">MAS Token Metadata</a></p>
</body>
</html>
```

### **mas-token-metadata.json** (your existing file)
```json
{
  "name": "MAS Sats",
  "description": "MAS Sats is the native token of the MAS Network Protocol, a Bitcoin Layer 3 DeFi trading platform. MAS Sats holders can earn trading fees from token trades and participate in the decentralized trading ecosystem.",
  "image": "https://teikolabs.com/icons/The Mas Network.svg",
  "xlink": "https://x.com/TeikoLabs",
  "homepage": "teikolabs.com",
  "telegram": "https://t.me/teikolabs21/1",
  "discord": "https://discord.gg/rx4AkP7xhu",
  "contract_address": "SP1T0VY3DNXRVP6HBM75DFWW0199CR0X15PC1D81B",
  "contract_name": "mas-sats-treasury",
  "symbol": "MAS",
  "decimals": 8,
  "network": "mainnet"
}
```

## 🎯 **Final URI for Blockchain**

```
https://teikolabs.com/mas-token-metadata.json
```

## ✅ **Test Your Deployment**

Once deployed, test these URLs:
- **Metadata**: https://teikolabs.com/mas-token-metadata.json
- **Image**: https://teikolabs.com/icons/The Mas Network.svg

## 🚀 **Next Steps**

1. ✅ Deploy to GitHub Pages
2. 🔄 Set URI on blockchain: `https://teikolabs.com/mas-token-metadata.json`
3. 🎉 Your MAS token will appear with image and metadata!

# Deploy This Project to teikolabs.com

## 🎯 **Your Full URI**
Once deployed, your MAS token metadata URI will be:
```
https://teikolabs.com/mas-token-metadata.json
```

## 🚀 **Deployment Options**

### **Option 1: Deploy to Vercel (Recommended)**

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Add MAS token metadata with teikolabs.com URLs"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Connect your GitHub repository
   - Set custom domain: `teikolabs.com`
   - Deploy!

3. **Your metadata will be available at:**
   - https://teikolabs.com/mas-token-metadata.json
   - https://teikolabs.com/icons/The Mas Network.svg

### **Option 2: Deploy to Netlify**

1. **Push to GitHub** (same as above)

2. **Deploy to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Connect your GitHub repository
   - Set custom domain: `teikolabs.com`
   - Deploy!

### **Option 3: Deploy to GitHub Pages**

1. **Add GitHub Pages configuration**
   ```bash
   # Add this to your package.json scripts
   "export": "next build && next export"
   ```

2. **Create .github/workflows/deploy.yml**
   ```yaml
   name: Deploy to GitHub Pages
   on:
     push:
       branches: [ main ]
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v2
         - uses: actions/setup-node@v2
           with:
             node-version: '18'
         - run: npm ci
         - run: npm run build
         - run: npm run export
         - uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./out
   ```

3. **Enable GitHub Pages**
   - Go to repository Settings → Pages
   - Set source to GitHub Actions
   - Add custom domain: `teikolabs.com`

## 📋 **Files Already Ready**

Your project already has:
- ✅ `public/mas-token-metadata.json` (updated with teikolabs.com URLs)
- ✅ `public/icons/The Mas Network.svg` (MAS token image)
- ✅ `public/test-token.html` (test page)

## 🔗 **Test URLs After Deployment**

Once deployed, test these:
- **Metadata**: https://teikolabs.com/mas-token-metadata.json
- **Image**: https://teikolabs.com/icons/The Mas Network.svg
- **Test Page**: https://teikolabs.com/test-token.html

## 🎯 **Next Steps**

1. **Deploy your project** (choose one option above)
2. **Set the URI on blockchain**: `https://teikolabs.com/mas-token-metadata.json`
3. **Your MAS token will appear with image and metadata!**

## 💡 **Quick Deploy Command**

If you want to deploy right now:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set custom domain
vercel domains add teikolabs.com
```

## ✅ **What You'll Get**

After deployment:
- ✅ Professional teikolabs.com domain
- ✅ MAS token metadata accessible
- ✅ Token image accessible
- ✅ Ready for blockchain integration

const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function uploadToLocalGaia() {
  try {
    const imagePath = './public/icons/The Mas Network.svg';
    const walletAddress = 'ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4';
    const fileName = 'the-mas-network-token.svg';
    
    console.log('🔄 Uploading to local Gaia hub...');
    console.log('📁 Image file:', imagePath);
    console.log('👛 Wallet address:', walletAddress);
    console.log('🌐 Gaia hub: http://localhost:3001');
    
    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image file not found: ${imagePath}`);
    }
    
    // Read the image file
    const imageFile = fs.readFileSync(imagePath);
    
    // Create form data
    const formData = new FormData();
    formData.append('file', imageFile, {
      filename: fileName,
      contentType: 'image/svg+xml'
    });
    
    console.log('📤 Sending upload request...');
    
    // Upload to local Gaia hub
    const response = await fetch(`http://localhost:3001/store/${walletAddress}/${fileName}`, {
      method: 'POST',
      body: formData
    });
    
    console.log('📊 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    const gaiaUrl = result.publicURL;
    
    console.log('✅ Upload successful!');
    console.log('🌐 Your Gaia URL:', gaiaUrl);
    console.log('');
    console.log('📱 To view your image:');
    console.log('1. Open the URL above in your browser');
    console.log('2. Or use it in your token contract');
    console.log('');
    console.log('💡 Next steps:');
    console.log('1. Copy the Gaia URL');
    console.log('2. Use it in your token contract\'s set-token-uri function');
    
    return gaiaUrl;
    
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    console.log('');
    console.log('💡 Make sure your local Gaia hub is running:');
    console.log('   cd gaia-hub-local && node server.js');
  }
}

uploadToLocalGaia(); 
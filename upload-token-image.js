const { putFile } = require('@stacks/storage');
const { connect } = require('@stacks/connect');
const fs = require('fs');

async function uploadTokenImage() {
  try {
    // Your wallet address
    const walletAddress = 'ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4';
    
    // Read your SVG image file
    const imagePath = './public/icons/The Mas Network.svg';
    const imageFile = fs.readFileSync(imagePath);
    
    console.log('🔄 Starting Gaia upload...');
    console.log('📁 Image file:', imagePath);
    console.log('👛 Wallet address:', walletAddress);
    console.log('');
    console.log('⚠️  Note: This requires wallet authentication.');
    console.log('   Make sure your Leather wallet is connected and you have a Stacks ID.');
    console.log('');
    
    // Upload to Gaia
    const imageUrl = await putFile(imageFile, 'the-mas-network-token.svg', {
      encrypt: false,
      username: walletAddress,
      gaiaHubUrl: 'https://hub.blockstack.org' // Default Gaia hub
    });
    
    console.log('✅ Upload successful!');
    console.log('🌐 Your Gaia URL:', imageUrl);
    
    return imageUrl;
    
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    console.log('');
    console.log('💡 Troubleshooting:');
    console.log('1. Make sure you have a Stacks ID (like yourname.id)');
    console.log('2. Ensure your Leather wallet is connected');
    console.log('3. Try using a different Gaia hub URL');
    console.log('');
    console.log('🔧 Alternative Gaia hubs to try:');
    console.log('   - https://gaia.blockstack.org');
    console.log('   - https://hub.blockstack.org');
    console.log('');
    throw error;
  }
}

// Run the upload
uploadTokenImage(); 
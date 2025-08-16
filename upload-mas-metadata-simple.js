const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration - using anon key for uploads
const supabaseUrl = 'https://yivwcilvhtswlmdcjpqw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpdndjaWx2aHRzd2xtZGNqcHF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNjU5ODMsImV4cCI6MjA2Nzk0MTk4M30.THYtuWzFspiYPBwuJutX91GWE9zNUIMJmtG0OA_1qnc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadMasMetadata() {
  try {
    console.log('🚀 Starting MAS token metadata upload...');
    
    // Read the MAS token metadata
    const metadataPath = path.join(__dirname, 'mas-token-metadata.json');
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    
    console.log('📄 Metadata loaded:', metadata.name);
    
    // Try to upload to different possible bucket names
    const possibleBuckets = ['uri', 'tokens', 'metadata', 'public'];
    let uploaded = false;
    let publicUrl = '';
    
    for (const bucketName of possibleBuckets) {
      try {
        console.log(`📤 Trying to upload to ${bucketName} bucket...`);
        
        // Generate a unique filename
        const timestamp = Date.now();
        const filename = `mas-token-metadata-${timestamp}.json`;
        
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(filename, JSON.stringify(metadata, null, 2), {
            contentType: 'application/json',
            upsert: false
          });
        
        if (!error) {
          console.log(`✅ Successfully uploaded to ${bucketName} bucket!`);
          publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${filename}`;
          uploaded = true;
          break;
        } else {
          console.log(`❌ Failed to upload to ${bucketName}:`, error.message);
        }
      } catch (err) {
        console.log(`❌ Error with ${bucketName} bucket:`, err.message);
      }
    }
    
    if (!uploaded) {
      console.log('\n⚠️  Could not upload to any existing bucket.');
      console.log('📋 Alternative approach: Create a public JSON file');
      
      // Create a public JSON file that can be served
      const publicMetadataPath = path.join(__dirname, 'public', 'mas-token-metadata.json');
      
      // Ensure public directory exists
      if (!fs.existsSync(path.join(__dirname, 'public'))) {
        fs.mkdirSync(path.join(__dirname, 'public'));
      }
      
      // Copy metadata to public directory
      fs.writeFileSync(publicMetadataPath, JSON.stringify(metadata, null, 2));
      
      // Create a relative URL that can be served by your Next.js app
      publicUrl = '/mas-token-metadata.json';
      
      console.log('✅ Created public metadata file at:', publicMetadataPath);
      console.log('🔗 Public URL will be:', publicUrl);
    }
    
    // Update the token cards data with the new URI
    const tokenCards = [
      {
        id: 1,
        isComingSoon: false,
        isHidden: false,
        tabType: "featured",
        dexInfo: "SP1T0VY3DNXRVP6HBM75DFWW0199CR0X15PC1D81B.mas-sats-treasury",
        tokenInfo: "SP1T0VY3DNXRVP6HBM75DFWW0199CR0X15PC1D81B.mas-sats",
        symbol: "MAS",
        revenue: 0,
        liquidity: 0,
        network: "mainnet",
        metadataUri: publicUrl,
        imageUrl: "/icons/The Mas Network.svg"
      }
    ];
    
    // Save the updated token cards
    fs.writeFileSync('token_cards_updated.json', JSON.stringify(tokenCards, null, 2));
    console.log('💾 Updated token cards saved to token_cards_updated.json');
    
    console.log('\n🎉 Success! Your MAS token now has a metadata URI:');
    console.log(publicUrl);
    console.log('\n📋 Next steps:');
    console.log('1. If using Supabase URL, verify it works by visiting in your browser');
    console.log('2. If using local path, the file will be served by your Next.js app');
    console.log('3. Update your database with the new token_cards_updated.json data');
    console.log('4. The image URL remains as "/icons/The Mas Network.svg" for local serving');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the upload
uploadMasMetadata();

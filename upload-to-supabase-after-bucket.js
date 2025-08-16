const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = 'https://yivwcilvhtswlmdcjpqw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpdndjaWx2aHRzd2xtZGNqcHF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNjU5ODMsImV4cCI6MjA2Nzk0MTk4M30.THYtuWzFspiYPBwuJutX91GWE9zNUIMJmtG0OA_1qnc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadToSupabase() {
  try {
    console.log('🚀 Uploading MAS token metadata to Supabase...');
    
    // Read the MAS token metadata
    const metadataPath = path.join(__dirname, 'mas-token-metadata.json');
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    
    console.log('📄 Metadata loaded:', metadata.name);
    
    // Generate a unique filename
    const timestamp = Date.now();
    const filename = `mas-token-metadata-${timestamp}.json`;
    
    // Upload to the uri bucket (must be created first in Supabase dashboard)
    console.log('📤 Uploading to uri bucket...');
    const { data, error } = await supabase.storage
      .from('uri')
      .upload(filename, JSON.stringify(metadata, null, 2), {
        contentType: 'application/json',
        upsert: false
      });
    
    if (error) {
      console.error('❌ Error uploading:', error);
      console.log('\n💡 Make sure you have:');
      console.log('1. Created the "uri" bucket in Supabase dashboard');
      console.log('2. Set the bucket as public');
      console.log('3. Have proper permissions');
      return;
    }
    
    console.log('✅ Successfully uploaded to Supabase!');
    
    // Generate the public URL
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/uri/${filename}`;
    console.log('🔗 Public URI:', publicUrl);
    
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
    fs.writeFileSync('token_cards_supabase.json', JSON.stringify(tokenCards, null, 2));
    console.log('💾 Updated token cards saved to token_cards_supabase.json');
    
    console.log('\n🎉 Success! Your MAS token now has a Supabase metadata URI:');
    console.log(publicUrl);
    console.log('\n📋 Next steps:');
    console.log('1. Verify the URI works by visiting it in your browser');
    console.log('2. Update your database with the new token_cards_supabase.json data');
    console.log('3. The image URL remains as "/icons/The Mas Network.svg" for local serving');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the upload
uploadToSupabase();

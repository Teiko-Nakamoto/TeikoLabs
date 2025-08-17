async function checkCurrentURI() {
  try {
    console.log('🔍 Checking current URI on MAS token contract...\n');
    
    const contractAddress = 'SP1T0VY3DNXRVP6HBM75DFWW0199CR0X15PC1D81B';
    const contractName = 'mas-sats';
    
    console.log('📋 Contract Details:');
    console.log('   Address:', contractAddress);
    console.log('   Name:', contractName);
    console.log('   Full ID:', `${contractAddress}.${contractName}`);
    
    // Try to read the current token URI
    console.log('\n🔗 Checking current token URI...');
    
    try {
      const response = await fetch(`https://api.hiro.so/extended/v1/contract/${contractAddress}.${contractName}/readonly/get-token-uri`);
      const data = await response.json();
      
      if (data.result) {
        console.log('✅ Current URI:', data.result);
        
        if (data.result === 'https://teikolabs.com/mas-token-metadata.json') {
          console.log('🎉 URI is already set correctly!');
        } else {
          console.log('⚠️  URI needs to be updated');
          console.log('   Current:', data.result);
          console.log('   Should be: https://teikolabs.com/mas-token-metadata.json');
        }
      } else {
        console.log('❌ No URI set or function not found');
        console.log('   You need to set the URI on the contract');
      }
    } catch (error) {
      console.log('❌ Could not fetch current URI');
      console.log('   Error:', error.message);
    }
    
    console.log('\n📋 Next Steps:');
    console.log('1. If no URI is set, call set-token-uri function');
    console.log('2. If wrong URI is set, call set-token-uri with correct URL');
    console.log('3. Wait for transaction confirmation');
    console.log('4. Check your wallet - should show MAS token with image');
    
    console.log('\n🎯 Correct URI to set:');
    console.log('   https://teikolabs.com/mas-token-metadata.json');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkCurrentURI();

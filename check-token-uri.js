const { fetchCallReadOnlyFunction } = require('@stacks/transactions');
const { STACKS_TESTNET } = require('@stacks/network');

async function checkTokenURI() {
  try {
    console.log('🔍 Checking token URI on testnet...');
    
    const result = await fetchCallReadOnlyFunction({
      contractAddress: 'ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4',
      contractName: 'favourable-ivory',
      functionName: 'get-token-uri',
      functionArgs: [],
      network: STACKS_TESTNET,
      senderAddress: 'ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4'
    });
    
    console.log('✅ Token URI result:', result);
    
    if (result && result.value) {
      const uri = result.value;
      console.log('🌐 Current Token URI:', uri);
      console.log('');
      console.log('📱 To view the image:');
      console.log('1. Copy the URI above');
      console.log('2. Paste it in your browser');
      console.log('3. Or use it in wallets/marketplaces');
    } else {
      console.log('❌ No token URI set yet');
      console.log('');
      console.log('💡 You can still test the image URL directly:');
      console.log('https://hub.blockstack.org/hub/ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4/The Mas Network.svg');
    }
    
  } catch (error) {
    console.error('❌ Error checking token URI:', error.message);
    console.log('');
    console.log('💡 Try viewing the image directly:');
    console.log('https://hub.blockstack.org/hub/ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4/The Mas Network.svg');
  }
}

checkTokenURI(); 
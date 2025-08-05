// Test script to check locked balance for contract address
const testLockedBalance = async () => {
  try {
    console.log('🔍 Testing locked balance for contract address...');
    
    const contractAddress = 'ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4';
    
    const response = await fetch(`http://localhost:3000/api/get-majority-holder?debug=true&address=${contractAddress}`);
    const data = await response.json();
    
    console.log('📊 Locked Balance Response:', data);
    
  } catch (error) {
    console.error('❌ Error testing locked balance:', error);
  }
};

// Run the test
testLockedBalance(); 
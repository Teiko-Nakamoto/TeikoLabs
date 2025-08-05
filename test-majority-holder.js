// Test script to debug majority holder API
const testMajorityHolder = async () => {
  try {
    console.log('🔍 Testing majority holder API...');
    const response = await fetch('http://localhost:3000/api/get-majority-holder');
    const data = await response.json();
    
    console.log('📊 API Response:', data);
    console.log('📊 Address:', data.address);
    console.log('📊 Locked Tokens:', data.lockedTokens);
    console.log('📊 Total Locked Tokens:', data.totalLockedTokens);
    console.log('📊 Cached:', data.cached);
    
  } catch (error) {
    console.error('❌ Error testing API:', error);
  }
};

// Run the test
testMajorityHolder(); 
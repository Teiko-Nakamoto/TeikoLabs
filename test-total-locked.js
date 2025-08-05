// Test script to check total locked tokens
const testTotalLocked = async () => {
  try {
    console.log('🔍 Testing total locked tokens API...');
    const response = await fetch('http://localhost:3000/api/total-locked-tokens');
    const data = await response.json();
    
    console.log('📊 Total Locked Response:', data);
    console.log('📊 Balance:', data.balance);
    
  } catch (error) {
    console.error('❌ Error testing total locked API:', error);
  }
};

// Run the test
testTotalLocked(); 
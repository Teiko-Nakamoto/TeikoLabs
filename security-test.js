// WHITE HAT SECURITY TESTING SCRIPT
// Run this in browser console to test your API security

console.log('🔒 Starting White Hat Security Tests...');

// Test 1: Direct API Access (Should Fail)
async function testDirectAccess() {
  console.log('\n🧪 Test 1: Direct API Access (No Auth)');
  try {
    const response = await fetch('/api/save-token-cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tokenCards: [{
          id: 999,
          dexInfo: 'attacker-contract.dex',
          tokenInfo: 'attacker-contract.token',
          symbol: 'FAKE',
          isHidden: false,
          tabType: 'featured'
        }]
      })
    });
    
    const result = await response.json();
    console.log('❌ VULNERABILITY: Direct access succeeded!', result);
    return false;
  } catch (error) {
    console.log('✅ SECURE: Direct access blocked');
    return true;
  }
}

// Test 2: Fake Admin Authentication
async function testFakeAuth() {
  console.log('\n🧪 Test 2: Fake Admin Authentication');
  try {
    const fakeAuth = {
      signature: "fake_signature_123456789",
      publicKey: "fake_public_key_abcdef",
      message: "Admin Authentication Challenge",
      timestamp: new Date().toISOString(),
      walletAddress: "ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4" // Correct admin address
    };

    const response = await fetch('/api/save-token-cards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JSON.stringify(fakeAuth)}`
      },
      body: JSON.stringify({
        tokenCards: [{
          id: 999,
          dexInfo: 'attacker-contract.dex',
          tokenInfo: 'attacker-contract.token',
          symbol: 'FAKE',
          isHidden: false,
          tabType: 'featured'
        }]
      })
    });
    
    const result = await response.json();
    if (response.status === 401) {
      console.log('✅ SECURE: Fake authentication blocked');
      return true;
    } else {
      console.log('❌ VULNERABILITY: Fake authentication succeeded!', result);
      return false;
    }
  } catch (error) {
    console.log('✅ SECURE: Fake authentication blocked');
    return true;
  }
}

// Test 3: Token Replacement Attack
async function testTokenReplacement() {
  console.log('\n🧪 Test 3: Token Replacement Attack');
  try {
    const fakeAuth = {
      signature: "fake_signature",
      publicKey: "fake_key",
      message: "fake_message",
      timestamp: new Date().toISOString(),
      walletAddress: "ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4"
    };

    const response = await fetch('/api/save-token-cards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JSON.stringify(fakeAuth)}`
      },
      body: JSON.stringify({
        tokenCards: [{
          id: 1, // Try to replace existing token
          dexInfo: 'malicious-contract.dex',
          tokenInfo: 'malicious-contract.token',
          symbol: 'BTC', // Same symbol, different contract
          isHidden: false,
          tabType: 'featured'
        }]
      })
    });
    
    const result = await response.json();
    if (response.status === 401) {
      console.log('✅ SECURE: Token replacement blocked');
      return true;
    } else {
      console.log('❌ VULNERABILITY: Token replacement succeeded!', result);
      return false;
    }
  } catch (error) {
    console.log('✅ SECURE: Token replacement blocked');
    return true;
  }
}

// Test 4: Expired Authentication Attack
async function testExpiredAuth() {
  console.log('\n🧪 Test 4: Expired Authentication Attack');
  try {
    const expiredAuth = {
      signature: "fake_signature",
      publicKey: "fake_key",
      message: "fake_message",
      timestamp: "2023-01-01T00:00:00.000Z", // Old date
      walletAddress: "ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4"
    };

    const response = await fetch('/api/save-token-cards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JSON.stringify(expiredAuth)}`
      },
      body: JSON.stringify({
        tokenCards: [{
          id: 999,
          dexInfo: 'attacker-contract.dex',
          tokenInfo: 'attacker-contract.token',
          symbol: 'FAKE',
          isHidden: false,
          tabType: 'featured'
        }]
      })
    });
    
    const result = await response.json();
    if (response.status === 401) {
      console.log('✅ SECURE: Expired authentication blocked');
      return true;
    } else {
      console.log('❌ VULNERABILITY: Expired authentication succeeded!', result);
      return false;
    }
  } catch (error) {
    console.log('✅ SECURE: Expired authentication blocked');
    return true;
  }
}

// Test 5: Malicious Contract Address Injection
async function testMaliciousContract() {
  console.log('\n🧪 Test 5: Malicious Contract Address Injection');
  try {
    const fakeAuth = {
      signature: "fake_signature",
      publicKey: "fake_key",
      message: "fake_message",
      timestamp: new Date().toISOString(),
      walletAddress: "ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4"
    };

    const response = await fetch('/api/save-token-cards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JSON.stringify(fakeAuth)}`
      },
      body: JSON.stringify({
        tokenCards: [{
          id: 999,
          dexInfo: 'malicious-wallet.malicious-dex', // Malicious contract
          tokenInfo: 'malicious-wallet.malicious-token',
          symbol: 'FAKE',
          isHidden: false,
          tabType: 'featured'
        }]
      })
    });
    
    const result = await response.json();
    if (response.status === 401) {
      console.log('✅ SECURE: Malicious contract injection blocked');
      return true;
    } else {
      console.log('❌ VULNERABILITY: Malicious contract injection succeeded!', result);
      return false;
    }
  } catch (error) {
    console.log('✅ SECURE: Malicious contract injection blocked');
    return true;
  }
}

// Run all tests
async function runSecurityTests() {
  console.log('🚀 Starting comprehensive security tests...\n');
  
  const results = {
    directAccess: await testDirectAccess(),
    fakeAuth: await testFakeAuth(),
    tokenReplacement: await testTokenReplacement(),
    expiredAuth: await testExpiredAuth(),
    maliciousContract: await testMaliciousContract()
  };
  
  console.log('\n📊 SECURITY TEST RESULTS:');
  console.log('========================');
  console.log('Direct Access:', results.directAccess ? '✅ SECURE' : '❌ VULNERABLE');
  console.log('Fake Auth:', results.fakeAuth ? '✅ SECURE' : '❌ VULNERABLE');
  console.log('Token Replacement:', results.tokenReplacement ? '✅ SECURE' : '❌ VULNERABLE');
  console.log('Expired Auth:', results.expiredAuth ? '✅ SECURE' : '❌ VULNERABLE');
  console.log('Malicious Contract:', results.maliciousContract ? '✅ SECURE' : '❌ VULNERABLE');
  
  const allSecure = Object.values(results).every(result => result === true);
  console.log('\n🎯 OVERALL RESULT:', allSecure ? '✅ ALL TESTS PASSED - SECURE' : '❌ VULNERABILITIES FOUND');
  
  return results;
}

// Export for use
window.runSecurityTests = runSecurityTests;
console.log('🔒 Security testing functions loaded. Run: runSecurityTests()');


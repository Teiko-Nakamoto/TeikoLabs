// Create a test token for testing pending token detection
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestToken() {
  try {
    console.log('🔧 Creating test token...');
    
    const testToken = {
      token_name: 'Test Project',
      token_symbol: 'TEST',
      token_description: 'A test token for testing pending token detection',
      token_contract_address: 'ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4.test',
      dex_contract_address: '', // Empty - this makes it pending
      creator_wallet_address: 'ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4',
      creator_signature: 'test_signature',
      deployment_message: 'Test deployment',
      initial_supply: 2100000000000000,
      initial_price: 0.00000001,
      trading_fee_percentage: 2.00,
      deployment_status: 'deployed', // This makes it deployed
      deployment_tx_hash: 'test_tx_hash_123',
      deployment_block_number: 12345,
      network: 'testnet',
      deployed_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('user_tokens')
      .insert([testToken])
      .select();
    
    if (error) {
      console.error('❌ Error creating test token:', error);
      return;
    }
    
    console.log('✅ Test token created successfully!');
    console.log('📊 Token data:', data[0]);
    
    // Now test the API endpoint
    console.log('\n🧪 Testing API endpoint...');
    const response = await fetch(`http://localhost:3001/api/user-tokens/list?creator=ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4`);
    
    if (response.ok) {
      const apiData = await response.json();
      console.log('✅ API response:', apiData);
      console.log('📊 Tokens found:', apiData.tokens.length);
      
      const pendingTokens = apiData.tokens.filter(token => 
        token.deploymentStatus === 'deployed' && 
        (!token.dexContractAddress || token.dexContractAddress === '')
      );
      
      console.log('⏳ Pending tokens:', pendingTokens.length);
      if (pendingTokens.length > 0) {
        console.log('📋 Pending token details:', pendingTokens[0]);
      }
    } else {
      console.error('❌ API test failed:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createTestToken();

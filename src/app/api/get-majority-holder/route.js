// API Route: Get Current Majority Holder Information from Smart Contract (Daily Cache)
import { NextResponse } from 'next/server';
import { supabaseServer } from '../../utils/supabaseServer';
import { fetchCallReadOnlyFunction } from '@stacks/transactions';
import { getHiroNetworkServerSide } from '../../utils/hiro-config';

// Daily cache storage
const dailyCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Helper function to get cached majority holder data
function getCachedMajorityHolder(contractKey) {
  if (dailyCache.has(contractKey)) {
    const cached = dailyCache.get(contractKey);
    const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;
    
    if (!isExpired) {
      console.log(`💾 Daily cache HIT for majority holder (age: ${Math.floor((Date.now() - cached.timestamp) / (1000 * 60 * 60))} hours)`);
      return cached.data;
    } else {
      console.log(`⏰ Daily cache EXPIRED for majority holder (age: ${Math.floor((Date.now() - cached.timestamp) / (1000 * 60 * 60))} hours)`);
    }
  }
  
  console.log(`🔄 Daily cache MISS for majority holder - fetching fresh data...`);
  return null;
}

// Helper function to cache majority holder data
function cacheMajorityHolder(contractKey, data) {
  dailyCache.set(contractKey, {
    data: data,
    timestamp: Date.now()
  });
  console.log(`💾 Cached majority holder data for ${contractKey}`);
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get('tokenId');

    if (!tokenId) {
      return NextResponse.json({ error: 'Token ID is required' }, { status: 400 });
    }

    console.log('🔍 Fetching majority holder data for token:', tokenId);

    // Get token data
    console.log('🔍 Fetching token data from database for tokenId:', tokenId);
    const { data: token, error: tokenError } = await supabaseServer
      .from('token_cards')
      .select('*')
      .eq('id', tokenId)
      .single();

    if (tokenError) {
      console.error('❌ Error fetching token:', tokenError);
      return NextResponse.json({ error: 'Token not found', details: tokenError.message }, { status: 404 });
    }

            console.log('✅ Token data fetched:', token);
        console.log('🔍 Token contract info:', {
          dex_info: token.dex_info,
          token_contract_address: token.token_contract_address,
          token_contract_name: token.token_contract_name
        });

    // Get majority holder from smart contract
    let majorityHolderAddress = null;
    let hasMajorityHolder = false;
    let result = null; // Initialize result variable
    let contractKey = null; // Initialize contractKey variable

    if (token.dex_info) {
      // Create cache key
      contractKey = token.dex_info;
      
      // Check daily cache first
      const cachedData = getCachedMajorityHolder(contractKey);
      if (cachedData) {
        return NextResponse.json(cachedData);
      }
      try {
        // Auto-detect network based on address prefix and use Hiro API key
        const [contractAddress, contractName] = token.dex_info.split('.');
        const network = contractAddress.startsWith('ST') ? 'testnet' : 'mainnet';
        const stacksNetwork = getHiroNetworkServerSide(network);

        console.log('🔍 Calling smart contract for majority holder:', { 
          contractAddress, 
          contractName, 
          detectedNetwork: network,
          usingHiroAPI: true
        });
        
        // The get-majority-holder function is on the token contract, not the treasury
        // We need to get the token contract info from the database
        const tokenContractAddress = token.token_contract_address || contractAddress;
        const tokenContractName = token.token_contract_name || 'mas-sats';
        
        console.log('🔍 Using token contract for majority holder:', { 
          tokenContractAddress, 
          tokenContractName
        });

        // Call the get-majority-holder function from the smart contract
        console.log('🔍 Making smart contract call with:', {
          contractAddress: tokenContractAddress,
          contractName: tokenContractName,
          functionName: 'get-majority-holder',
          network: network,
          senderAddress: tokenContractAddress
        });
        
        const result = await fetchCallReadOnlyFunction({
          contractAddress: tokenContractAddress,
          contractName: tokenContractName,
          functionName: 'get-majority-holder',
          functionArgs: [],
          network: stacksNetwork,
          senderAddress: tokenContractAddress,
        });

        console.log('🔍 Smart contract result:', result);
        console.log('🔍 Full result JSON:', JSON.stringify(result, null, 2));

        // Parse the result properly
        if (result && result.value) {
          if (result.value.type === 'some' && result.value.value) {
            // There is a majority holder
            majorityHolderAddress = result.value.value;
            hasMajorityHolder = true;
          } else if (result.value.type === 'none') {
            // No majority holder
            majorityHolderAddress = null;
            hasMajorityHolder = false;
          }
        }

        console.log('👑 Majority holder from contract:', majorityHolderAddress, 'Valid:', hasMajorityHolder);

      } catch (contractError) {
        console.error('❌ Smart contract call failed:', contractError);
        hasMajorityHolder = false;
        majorityHolderAddress = null;
      }
    }

    // Get additional data from database for display purposes
    const { data: holders, error: holdersError } = await supabaseServer
      .from('user_tokens')
      .select('*')
      .eq('token_symbol', token.token_symbol);

    const totalHolders = holders && !holdersError ? holders.length : 0;

    console.log('✅ Majority holder data fetched successfully');
    
    const responseData = {
      success: true,
      token: {
        id: token.id,
        symbol: token.token_symbol,
        name: token.token_name,
        totalSupply: token.total_supply || 0
      },
      hasMajorityHolder: hasMajorityHolder,
      address: majorityHolderAddress,
      lockedTokens: hasMajorityHolder ? 0 : 0, // We'll need to get this from contract if needed
      percentage: hasMajorityHolder ? 0 : 0, // We'll need to calculate this if needed
      totalHolders: totalHolders,
      cached: false,
      cacheTimestamp: Date.now(),
      rawResult: result, // Add the raw smart contract result for debugging
      contractAddress: token.dex_info?.split('.')[0],
      contractName: token.dex_info?.split('.')[1]
    };

    // Cache successful results
    if (hasMajorityHolder && majorityHolderAddress) {
      cacheMajorityHolder(contractKey, responseData);
      responseData.cached = true;
    }

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('❌ Error fetching majority holder:', error);
    console.error('❌ Error stack:', error.stack);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
} 
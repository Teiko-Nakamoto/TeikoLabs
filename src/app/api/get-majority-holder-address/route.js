// API Route: Get Current Majority Holder Address from Smart Contract (Daily Cache)
import { NextResponse } from 'next/server';
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
    // Parse query parameters for contract info
    const { searchParams } = new URL(request.url);
    const dexInfo = searchParams.get('dexInfo');
    const tokenInfo = searchParams.get('tokenInfo');
    const networkParam = searchParams.get('network') || 'testnet';

    if (!dexInfo) {
      return NextResponse.json({ error: 'dexInfo is required' }, { status: 400 });
    }

    console.log('🔍 API: Getting majority holder address from contract:', { dexInfo, network: networkParam });

    // Parse the dexInfo to get contract address and name
    const [contractAddress, contractName] = dexInfo.split('.');

    if (!contractAddress || !contractName) {
      return NextResponse.json({ error: 'Invalid dexInfo format' }, { status: 400 });
    }

    // Create cache key
    const contractKey = `${contractAddress}.${contractName}`;
    
    // Check daily cache first
    const cachedData = getCachedMajorityHolder(contractKey);
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    // Auto-detect network based on address prefix and use Hiro API key
    const network = contractAddress.startsWith('ST') ? 'testnet' : 'mainnet';
    const stacksNetwork = getHiroNetworkServerSide(network);

    console.log('🌐 Network detection:', {
      originalAddress: contractAddress,
      addressPrefix: contractAddress.substring(0, 2),
      detectedNetwork: network,
      usingHiroAPI: true
    });

    try {
      // Call the get-majority-holder function from the smart contract
      const result = await fetchCallReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: 'get-majority-holder',
        functionArgs: [],
        network: stacksNetwork,
        senderAddress: contractAddress,
      });

      console.log('🔍 Smart contract result:', result);
      console.log('🔍 Result type:', typeof result);
      console.log('🔍 Result value:', result?.value);
      console.log('🔍 Result value type:', typeof result?.value);

      // Parse the result
      let majorityHolderAddress = null;
      
      if (result && result.value) {
        console.log('🔍 Parsing result.value:', result.value);
        console.log('🔍 result.value.type:', result.value.type);
        console.log('🔍 result.value.value:', result.value.value);
        
        // Handle the actual response format: { type: "ok", value: { type: "some", value: { type: "address", value: "SP1T0VY3DNXRVP6HBM75DFWW0199CR0X15PC1D81B" } } }
        if (result.value.type === 'some' && result.value.value && result.value.value.type === 'address') {
          majorityHolderAddress = result.value.value.value;
        } else if (result.value.type === 'address' && result.value.value) {
          // Direct address format
          majorityHolderAddress = result.value.value;
        } else if (result.value.type === 'principal' && result.value.value) {
          // Principal format
          majorityHolderAddress = result.value.value;
        } else if (result.value.value && typeof result.value.value === 'string') {
          // Simple string format
          majorityHolderAddress = result.value.value;
        } else if (typeof result.value === 'string') {
          // Direct string format
          majorityHolderAddress = result.value;
        }
      }

      // Check if address is valid (not null, empty, or zero address)
      const isValidAddress = majorityHolderAddress && 
                            typeof majorityHolderAddress === 'string' &&
                            majorityHolderAddress !== '' && 
                            majorityHolderAddress !== 'null' &&
                            !majorityHolderAddress.includes('none') &&
                            !majorityHolderAddress.includes('0x00');

      console.log('👑 Majority holder address:', majorityHolderAddress, 'Valid:', isValidAddress);

      const responseData = {
        success: true,
        majorityHolderAddress: isValidAddress ? majorityHolderAddress : null,
        hasValidHolder: isValidAddress,
        rawResult: result,
        cached: false,
        cacheTimestamp: Date.now()
      };

      // Cache successful results
      if (isValidAddress) {
        cacheMajorityHolder(contractKey, responseData);
        responseData.cached = true;
      }

      return NextResponse.json(responseData);

    } catch (contractError) {
      console.error('❌ Smart contract call failed:', contractError);
      
      // Return "None" if contract call fails
      return NextResponse.json({
        success: true,
        majorityHolderAddress: null,
        hasValidHolder: false,
        error: 'Contract call failed',
        details: contractError.message
      });
    }

  } catch (error) {
    console.error('❌ API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get majority holder address',
        details: error.message
      },
      { status: 500 }
    );
  }
}

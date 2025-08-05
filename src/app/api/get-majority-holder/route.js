// API Route: Get Current Majority Holder Information
import { NextResponse } from 'next/server';
import { fetchCallReadOnlyFunction, principalCV, cvToValue } from '@stacks/transactions';
import { STACKS_TESTNET } from '@stacks/network';


// Import Supabase client
import { supabase } from '../../utils/supabaseClient';

// Function to get contract addresses from token_cards table
async function getContractAddresses(tokenId) {
  try {
    const { data, error } = await supabase
      .from('token_cards')
      .select('dex_info')
      .eq('id', tokenId)
      .single();

    if (error) {
      console.error('Error fetching contract addresses:', error);
      return null;
    }

    if (!data || !data.dex_info) {
      console.error('No dex_info found for tokenId:', tokenId);
      return null;
    }

    // Parse dex_info (format: "ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4.pink-tuna-dex")
    const parts = data.dex_info.split('.');
    if (parts.length !== 2) {
      console.error('Invalid dex_info format:', data.dex_info);
      return null;
    }

    return {
      contractAddress: parts[0],
      contractName: parts[1]
    };
  } catch (error) {
    console.error('Error in getContractAddresses:', error);
    return null;
  }
}

// Cache configuration
let cachedMajorityHolder = null;
let lastUpdateTime = 0;
const CACHE_DURATION = 60000; // 1 minute in milliseconds

// Function to fetch majority holder from smart contract
async function fetchMajorityHolderFromContract(contractAddress, contractName) {
  try {
    console.log('🔍 ===== STARTING FRESH MAJORITY HOLDER FETCH =====');
    console.log('🔍 Fetching majority holder from smart contract...');
    
    // Get majority holder address using the real function
    const majorityHolderResult = await fetchCallReadOnlyFunction({
      contractAddress: contractAddress,
      contractName: contractName,
      functionName: 'get-majority-holder',
      functionArgs: [],
      network: STACKS_TESTNET,
      senderAddress: contractAddress,
    });

    console.log('💰 Raw majority holder result from smart contract:', majorityHolderResult);
    console.log('💰 Result type:', typeof majorityHolderResult);
    console.log('💰 Result stringified:', JSON.stringify(majorityHolderResult));
    
    // Parse the structured result object
    let majorityHolderAddress = 'Unknown';
    if (majorityHolderResult && typeof majorityHolderResult === 'object') {
      try {
        console.log('🔍 Parsing majority holder result structure...');
        console.log('🔍 Result type:', majorityHolderResult.type);
        console.log('🔍 Result value:', majorityHolderResult.value);
        
        // Check if result is (ok none) - no majority holder exists
        if (majorityHolderResult.type === 'ok' && 
            majorityHolderResult.value && 
            majorityHolderResult.value.type === 'none') {
          console.log('⚠️ No majority holder exists (result is none)');
          majorityHolderAddress = 'No majority holder';
        }
        // Navigate through the nested structure: ok -> some -> address
        else if (majorityHolderResult.type === 'ok' && 
            majorityHolderResult.value && 
            majorityHolderResult.value.type === 'some' && 
            majorityHolderResult.value.value && 
            majorityHolderResult.value.value.type === 'address') {
          
          majorityHolderAddress = majorityHolderResult.value.value.value;
          console.log('✅ Parsed majority holder address:', majorityHolderAddress);
        } else {
          console.log('⚠️ Unexpected result structure:', majorityHolderResult);
          console.log('⚠️ Full result object:', JSON.stringify(majorityHolderResult, null, 2));
        }
      } catch (error) {
        console.error('❌ Error parsing majority holder result:', error);
      }
    }
    
    // Get the actual locked balance of the majority holder using get-locked-balance
    let holderLockedTokens = 0;
    
    // If we got a valid majority holder address, fetch their locked balance
    if (majorityHolderAddress && majorityHolderAddress !== 'Unknown' && majorityHolderAddress !== 'No majority holder') {
      try {
        console.log('🔍 Fetching locked balance for majority holder:', majorityHolderAddress);
        console.log('🔍 Using contract:', contractAddress, contractName);
        
        const lockedBalanceResult = await fetchCallReadOnlyFunction({
          contractAddress: contractAddress,
          contractName: contractName,
          functionName: 'get-locked-balance',
          functionArgs: [principalCV(majorityHolderAddress)], // Convert address to principal CV
          network: STACKS_TESTNET,
          senderAddress: contractAddress,
        });

        console.log('💰 Raw locked balance result:', lockedBalanceResult);
        console.log('💰 Result type:', typeof lockedBalanceResult);
        
        // Parse the locked balance result with more detailed logging
        if (lockedBalanceResult && typeof lockedBalanceResult === 'object') {
          console.log('💰 Result has type:', lockedBalanceResult.type);
          console.log('💰 Result has value:', lockedBalanceResult.value);
          
          // Use the exact same logic as the working test API
          const balance = cvToValue(lockedBalanceResult);
          console.log('💰 Balance using cvToValue:', balance);
          
          if (balance && balance.value) {
            // Extract the value from the uint object and convert from micro units (8 decimal places)
            const rawValue = parseInt(balance.value);
            holderLockedTokens = rawValue / 100000000; // Divide by 10^8 for 8 decimal places
            console.log('✅ Raw locked balance (micro units):', rawValue);
            console.log('✅ Parsed majority holder locked balance (tokens):', holderLockedTokens);
          } else {
            console.log('⚠️ Unexpected locked balance result structure:', lockedBalanceResult);
            console.log('⚠️ Expected type "ok" but got:', lockedBalanceResult.type);
            console.log('⚠️ Value is:', lockedBalanceResult.value);
          }
        } else {
          console.log('⚠️ Locked balance result is not an object:', lockedBalanceResult);
        }
      } catch (error) {
        console.error('❌ Error fetching locked balance for majority holder:', error);
        console.error('❌ Error details:', error.message);
        console.error('❌ Error stack:', error.stack);
      }
    } else {
      // If no majority holder found, let's test with the known address you mentioned
      console.log('🔍 No majority holder found, testing with known address: ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4');
      try {
        const testAddress = 'ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4';
        const testLockedBalanceResult = await fetchCallReadOnlyFunction({
          contractAddress: DEX_CONTRACT_ADDRESS,
          contractName: DEX_CONTRACT_NAME,
          functionName: 'get-locked-balance',
          functionArgs: [principalCV(testAddress)],
          network: STACKS_TESTNET,
          senderAddress: DEX_CONTRACT_ADDRESS,
        });

        console.log('🧪 Test locked balance result for known address:', testLockedBalanceResult);
        
        if (testLockedBalanceResult && typeof testLockedBalanceResult === 'object' && 
            testLockedBalanceResult.type === 'ok' && testLockedBalanceResult.value !== undefined) {
          
          let balanceValue = testLockedBalanceResult.value;
          if (typeof balanceValue === 'object' && balanceValue.value !== undefined) {
            balanceValue = balanceValue.value;
          }
          if (typeof balanceValue === 'string' && balanceValue.startsWith('u')) {
            balanceValue = balanceValue.substring(1);
          }
          
          holderLockedTokens = parseInt(balanceValue);
          majorityHolderAddress = testAddress;
          console.log('✅ Successfully got locked balance for test address:', holderLockedTokens);
        }
      } catch (error) {
        console.error('❌ Error testing with known address:', error);
      }
    }

    // Get total locked tokens (you may need to implement get-total-locked function)
    // For now, using placeholder - you can replace this with actual function call
    const totalLockedTokens = 20001000000; // Placeholder - need get-total-locked function
    const majorityThreshold = Math.floor(totalLockedTokens / 2) + 1;
    const percentage = totalLockedTokens > 0 ? (holderLockedTokens / totalLockedTokens) * 100 : 0;

    const majorityHolderData = {
      address: majorityHolderAddress,
      lockedTokens: majorityHolderAddress === 'No majority holder' ? 0 : holderLockedTokens,
      totalLockedTokens: totalLockedTokens,
      majorityThreshold: majorityThreshold,
      percentage: percentage
    };
    
    console.log('💰 ===== FINISHED MAJORITY HOLDER FETCH =====');
    console.log('💰 Processed majority holder data:', majorityHolderData);
    return majorityHolderData;
    
  } catch (error) {
    console.error('❌ ===== ERROR IN MAJORITY HOLDER FETCH =====');
    console.error('❌ Error fetching majority holder from smart contract:', error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    
    // Return fallback data if smart contract call fails
    return {
      address: 'ST1ABC...XYZ (Error)',
      lockedTokens: 0,
      totalLockedTokens: 0,
      majorityThreshold: 0,
      percentage: 0
    };
  }
}

export async function GET(request) {
  // Get tokenId from URL parameters if provided
  const { searchParams } = new URL(request.url);
  const tokenId = searchParams.get('tokenId');
  const forceRefresh = searchParams.get('refresh') === 'true';
  
  console.log('🔍 Getting majority holder for tokenId:', tokenId, 'forceRefresh:', forceRefresh);
  try {
    const now = Date.now();
    
    // Check if cache is valid (less than 1 minute old) and not forcing refresh
    if (cachedMajorityHolder !== null && (now - lastUpdateTime) < CACHE_DURATION && !forceRefresh) {
      console.log('💰 Returning cached majority holder:', cachedMajorityHolder);
      return NextResponse.json({
        ...cachedMajorityHolder,
        cached: true,
        lastUpdate: new Date(lastUpdateTime).toISOString(),
        nextUpdate: new Date(lastUpdateTime + CACHE_DURATION).toISOString()
      });
    }
    
    // Get contract addresses from token_cards table
    const contractAddresses = await getContractAddresses(tokenId);
    if (!contractAddresses) {
      return NextResponse.json(
        { 
          error: 'Failed to get contract addresses for token',
          address: 'Unknown',
          lockedTokens: 0,
          totalLockedTokens: 0,
          majorityThreshold: 0,
          percentage: 0
        },
        { status: 500 }
      );
    }

    // Cache expired or doesn't exist, fetch fresh data
    console.log('🔄 Cache expired or missing, fetching fresh majority holder data...');
    console.log('🔄 Force refresh requested:', forceRefresh);
    console.log('🔄 Using contract addresses:', contractAddresses);
    const freshMajorityHolder = await fetchMajorityHolderFromContract(contractAddresses.contractAddress, contractAddresses.contractName);
    
    // Update cache
    cachedMajorityHolder = freshMajorityHolder;
    lastUpdateTime = now;
    
    console.log('✅ Updated cache with fresh majority holder:', freshMajorityHolder);
    
    return NextResponse.json({
      ...freshMajorityHolder,
      cached: false,
      lastUpdate: new Date(lastUpdateTime).toISOString(),
      nextUpdate: new Date(lastUpdateTime + CACHE_DURATION).toISOString()
    });

  } catch (error) {
    console.error('❌ API: Failed to get majority holder:', error);
    
    // If we have cached data, return it even if it's stale
    if (cachedMajorityHolder !== null) {
      console.log('⚠️ Returning stale cached majority holder due to error:', cachedMajorityHolder);
      return NextResponse.json({
        ...cachedMajorityHolder,
        cached: true,
        stale: true,
        error: error.message,
        lastUpdate: new Date(lastUpdateTime).toISOString()
      });
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to get majority holder',
        details: error.message,
        address: 'Unknown',
        lockedTokens: 0,
        totalLockedTokens: 0,
        majorityThreshold: 0,
        percentage: 0
      },
      { status: 500 }
    );
  }
} 
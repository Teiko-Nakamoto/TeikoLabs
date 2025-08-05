// Simple test API to debug get-locked-balance function
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

const TEST_ADDRESS = 'ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4';

export async function GET(request) {
  // Get parameters from URL
  const { searchParams } = new URL(request.url);
  const customAddress = searchParams.get('address');
  const tokenId = searchParams.get('tokenId');
  const addressToTest = customAddress || TEST_ADDRESS;
  
  try {
    console.log('🧪 Testing get-locked-balance function...');
    console.log('🧪 Test address:', addressToTest);
    console.log('🧪 Token ID:', tokenId);
    
    // Get contract addresses from token_cards table if tokenId is provided
    let contractAddress, contractName;
    if (tokenId) {
      const contractAddresses = await getContractAddresses(tokenId);
      if (!contractAddresses) {
        return NextResponse.json({
          success: false,
          error: 'Failed to get contract addresses for token',
          address: addressToTest,
          lockedTokens: 0
        }, { status: 500 });
      }
      contractAddress = contractAddresses.contractAddress;
      contractName = contractAddresses.contractName;
    } else {
      // Fallback to hardcoded values if no tokenId provided
      contractAddress = 'ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4';
      contractName = 'pink-tuna-dex';
    }
    
    console.log('🧪 Using contract:', contractAddress, contractName);
    
    const lockedBalanceResult = await fetchCallReadOnlyFunction({
      contractAddress: contractAddress,
      contractName: contractName,
      functionName: 'get-locked-balance',
      functionArgs: [principalCV(addressToTest)],
      network: STACKS_TESTNET,
      senderAddress: contractAddress,
    });

         // Follow the documentation: use cvToValue directly on the response
     const balance = cvToValue(lockedBalanceResult);
     console.log('🧪 Balance using cvToValue:', balance);
      
             let lockedTokens = 0;
       if (balance && balance.value) {
         // Extract the value from the uint object and convert from micro units (8 decimal places)
         const rawValue = parseInt(balance.value);
         lockedTokens = rawValue / 100000000; // Divide by 10^8 for 8 decimal places
         console.log('🧪 Raw locked balance (micro units):', rawValue);
         console.log('🧪 Parsed locked tokens (tokens):', lockedTokens);
       }
    
         return NextResponse.json({
       success: true,
       address: addressToTest,
       lockedTokens: lockedTokens,
       contractAddress: contractAddress,
       contractName: contractName
     });
    
  } catch (error) {
    console.error('🧪 Error in test:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      address: TEST_ADDRESS,
      lockedTokens: 0
    }, { status: 500 });
  }
} 
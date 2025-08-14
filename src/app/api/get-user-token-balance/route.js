// API Route: Get User Token Balance
import { NextResponse } from 'next/server';
import { fetchCallReadOnlyFunction, principalCV } from '@stacks/transactions';
import { STACKS_TESTNET, STACKS_MAINNET } from '@stacks/network';

// Custom JSON replacer to handle BigInt serialization
function jsonReplacer(key, value) {
  if (typeof value === 'bigint') {
    return value.toString() + 'n'; // Convert BigInt to string with 'n' suffix
  }
  return value;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const tokenId = searchParams.get('tokenId');
    const dexInfo = searchParams.get('dexInfo');

    console.log('🔍 API: get-user-token-balance - FULL REQUEST:', {
      address,
      tokenId,
      dexInfo,
      searchParams: Object.fromEntries(searchParams.entries())
    });

    if (!address) {
      console.log('❌ API: Missing address parameter');
      return NextResponse.json(
        { error: 'Address parameter is required' },
        { status: 400 }
      );
    }

    if (!dexInfo) {
      console.log('❌ API: Missing dexInfo parameter');
      return NextResponse.json(
        { error: 'DEX info parameter is required' },
        { status: 400 }
      );
    }

    // Auto-detect network based on address prefix
    const isTestnet = address.startsWith('ST');
    const network = isTestnet ? STACKS_TESTNET : STACKS_MAINNET;
    
    console.log('🌐 Auto-detected network:', {
      address,
      isTestnet,
      network: isTestnet ? 'testnet' : 'mainnet'
    });

    // Parse the dexInfo to get contract address and name
    const [dexAddress, dexName] = dexInfo.split('.');

    console.log('🔍 API: Getting user token balance for address:', address, 'on contract:', dexInfo, 'network:', isTestnet ? 'testnet' : 'mainnet');
    console.log('🔍 Parsed contract address:', dexAddress, 'contract name:', dexName);

    // Convert address to principal CV for the function argument
    const principalArg = principalCV(address);
    console.log('🔧 Converted address to principal CV:', principalArg);

    // Get user's token balance using get-balance function with user's address as argument
    const result = await fetchCallReadOnlyFunction({
      contractAddress: dexAddress,
      contractName: dexName,
      functionName: 'get-balance', // Changed from 'get-token-balance' to 'get-balance'
      functionArgs: [principalArg], // Added the user's address as argument
      network: network, // Use auto-detected network instead of hardcoded testnet
      senderAddress: address,
    });

    console.log('🔍 Raw blockchain result - FULL:', JSON.stringify(result, jsonReplacer, 2));
    console.log('🔍 Raw blockchain result - TYPE:', typeof result);
    console.log('🔍 Raw blockchain result - CONSTRUCTOR:', result?.constructor?.name);

    // Extract the balance value
    const rawValue = result?.value?.value || result?.value || null;
    console.log('🔍 Raw value extracted:', rawValue, 'Type:', typeof rawValue);

    if (!rawValue) {
      console.log('❌ API: No raw value found in result');
      return NextResponse.json({
        success: true,
        balance: 0,
        address: address,
        debug: {
          rawResult: result,
          message: 'No raw value found'
        }
      });
    }

    // Convert from smallest units (8 decimal places) to whole tokens
    let balance = 0;
    if (typeof rawValue === 'bigint') {
      balance = Number(rawValue);
    } else {
      balance = parseInt(rawValue);
    }
    
    const tokensInWholeUnits = balance / 100000000;
    const finalBalance = Math.floor(tokensInWholeUnits);
    
    console.log('💰 User Token Balance - CONVERSION:', {
      rawValue: rawValue,
      balance: balance,
      tokensInWholeUnits: tokensInWholeUnits,
      finalBalance: finalBalance
    });

    return NextResponse.json({
      success: true,
      balance: finalBalance,
      address: address,
      network: isTestnet ? 'testnet' : 'mainnet',
      debug: {
        rawValue: rawValue,
        balance: balance,
        tokensInWholeUnits: tokensInWholeUnits,
        finalBalance: finalBalance
      }
    });

  } catch (error) {
    console.error('❌ API: Failed to get user token balance - FULL:', error);
    console.error('❌ API: Failed to get user token balance - MESSAGE:', error.message);
    console.error('❌ API: Failed to get user token balance - STACK:', error.stack);
    
    return NextResponse.json(
      { 
        error: 'Failed to get user token balance',
        details: error.message,
        fullError: error.toString()
      },
      { status: 500 }
    );
  }
} 
// API Route: Get User Token Balance
import { NextResponse } from 'next/server';
import { fetchCallReadOnlyFunction } from '@stacks/transactions';
import { STACKS_TESTNET } from '@stacks/network';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const tokenId = searchParams.get('tokenId');
    const dexInfo = searchParams.get('dexInfo');

    if (!address) {
      return NextResponse.json(
        { error: 'Address parameter is required' },
        { status: 400 }
      );
    }

    if (!dexInfo) {
      return NextResponse.json(
        { error: 'DEX info parameter is required' },
        { status: 400 }
      );
    }

    // Parse the dexInfo to get contract address and name
    const [dexAddress, dexName] = dexInfo.split('.');

    console.log('🔍 API: Getting user token balance for address:', address, 'on contract:', dexInfo);
    console.log('🔍 Parsed contract address:', dexAddress, 'contract name:', dexName);

    // Get user's token balance
    const result = await fetchCallReadOnlyFunction({
      contractAddress: dexAddress,
      contractName: dexName,
      functionName: 'get-token-balance',
      functionArgs: [],
      network: STACKS_TESTNET,
      senderAddress: address,
    });

    console.log('🔍 Raw blockchain result:', result);

    const balance = parseInt(result?.value?.value || result?.value || 0);
    
    console.log('💰 User Token Balance:', balance);

    return NextResponse.json({
      success: true,
      balance: balance,
      address: address
    });

  } catch (error) {
    console.error('❌ API: Failed to get user token balance:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get user token balance',
        details: error.message
      },
      { status: 500 }
    );
  }
} 
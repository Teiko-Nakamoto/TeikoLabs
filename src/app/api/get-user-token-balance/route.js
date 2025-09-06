import { NextResponse } from 'next/server';
import { callReadOnlyFunction, principalCV } from '@stacks/transactions';
import { STACKS_TESTNET, STACKS_MAINNET } from '@stacks/network';
import { DEX_CONTRACT_ADDRESS, TOKEN_CONTRACT_NAME } from '../../utils/fetchTokenData';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const principal = searchParams.get('principal');
    const networkParam = searchParams.get('network');
    const overrideAddress = searchParams.get('address');
    const overrideName = searchParams.get('name');

    if (!principal) {
      return NextResponse.json({ success: false, error: 'Missing principal' }, { status: 400 });
    }

    // Default to testnet unless explicitly specified
    const selectedAddress = overrideAddress || DEX_CONTRACT_ADDRESS;
    const selectedName = overrideName || TOKEN_CONTRACT_NAME;
    const isMainnet = networkParam === 'mainnet' || selectedAddress?.startsWith('SP');
    const network = isMainnet ? STACKS_MAINNET : STACKS_TESTNET;

    const result = await callReadOnlyFunction({
      contractAddress: selectedAddress,
      contractName: selectedName,
      functionName: 'get-balance',
      functionArgs: [principalCV(principal)],
      network,
      senderAddress: principal,
    });

    const raw = result?.value?.value || result?.value || 0;
    let rawValue = 0;
    if (typeof raw === 'bigint') rawValue = Number(raw); else rawValue = parseInt(raw);
    const tokens = Math.floor((rawValue || 0) / 100000000);

    return NextResponse.json({ success: true, balance: tokens });
  } catch (error) {
    console.error('❌ get-user-token-balance error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
} 
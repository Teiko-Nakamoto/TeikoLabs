import { NextResponse } from 'next/server';
import { callReadOnlyFunction, principalCV } from '@stacks/transactions';
import { STACKS_TESTNET, STACKS_MAINNET } from '@stacks/network';
import { DEX_CONTRACT_ADDRESS, TOKEN_CONTRACT_NAME } from '../../utils/fetchTokenData';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const principal = searchParams.get('principal');
    const networkParam = searchParams.get('network');

    if (!principal) {
      return NextResponse.json({ success: false, error: 'Missing principal' }, { status: 400 });
    }

    // Default to testnet unless explicitly specified
    const isMainnet = networkParam === 'mainnet' || DEX_CONTRACT_ADDRESS?.startsWith('SP');
    const network = isMainnet ? STACKS_MAINNET : STACKS_TESTNET;

    const result = await callReadOnlyFunction({
      contractAddress: DEX_CONTRACT_ADDRESS,
      contractName: TOKEN_CONTRACT_NAME,
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
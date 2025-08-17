/**
 * API Route: Get User sBTC Balance
 * 
 * PURPOSE: Fetches sBTC token balance for a user address on mainnet/testnet
 * USES: Hiro API with your API key for rate limit access (900 requests/min)
 * CACHE: 15-second caching to reduce API calls
 * 
 * This endpoint is used by the trading interface to show user's sBTC balance
 * for trading operations. Auto-detects network based on address prefix.
 */
import { NextResponse } from 'next/server';
import { rateLimitMiddleware, addRateLimitHeaders } from '../../utils/rateLimiter';
import { withCors } from '../../utils/corsMiddleware';
import { loggedBlockchainCall } from '../../utils/cacheLogger';
import { getHiroNetworkServerSide } from '../../utils/hiro-config';
import { SATS_CONTRACT_ADDRESS } from '../../utils/constants-test';
import { MAINNET_SBTC_CONTRACT_ADDRESS } from '../../utils/mainnetTokenData';

async function handler(request) {
  try {
    const { searchParams } = new URL(request.url);
    const principal = searchParams.get('principal');
    const lastUserTxId = searchParams.get('lastTx') || 'baseline';

    if (!principal) {
      return NextResponse.json(
        { error: 'Missing required parameter', message: 'principal is required' },
        { status: 400 }
      );
    }

    // Auto-detect network based on address prefix
    const isTestnet = principal.startsWith('ST');
    const network = getHiroNetworkServerSide(isTestnet ? 'testnet' : 'mainnet');
    
    // Use appropriate sBTC contract based on network
    const sbtcContractAddress = isTestnet ? SATS_CONTRACT_ADDRESS : MAINNET_SBTC_CONTRACT_ADDRESS;
    const sbtcContractName = 'sbtc-token';
    
    console.log('🌐 Auto-detected network for sBTC balance:', {
      principal,
      isTestnet,
      network: isTestnet ? 'testnet' : 'mainnet',
      sbtcContract: `${sbtcContractAddress}.${sbtcContractName}`
    });

    const rateLimitInfo = await rateLimitMiddleware(request, 'blockchain');
    if (!rateLimitInfo.allowed) {
      const response = NextResponse.json(
        { error: 'Rate limit exceeded', message: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
      return addRateLimitHeaders(response, rateLimitInfo);
    }

    console.log('🔁 API user-sats-balance', { principal, lastUserTxId, network: isTestnet ? 'testnet' : 'mainnet' });

    const result = await loggedBlockchainCall(
      `${isTestnet ? 'testnet' : 'mainnet'}-user-sats-${principal}-${lastUserTxId}`,
      async () => {
        // First try on-chain read-only call to sBTC get-balance(principal)
        try {
          console.log('🔍 Attempting contract call for sBTC balance...');
          const { fetchCallReadOnlyFunction, principalCV } = await import('@stacks/transactions');
          const chainResult = await fetchCallReadOnlyFunction({
            contractAddress: sbtcContractAddress,
            contractName: sbtcContractName,
            functionName: 'get-balance',
            functionArgs: [principalCV(principal)],
            network: network,
            senderAddress: principal,
          });
          
          console.log('🔍 Contract call result:', chainResult);
          
          const raw = chainResult?.value?.value ?? chainResult?.value ?? 0;
          const balance = typeof raw === 'string' ? parseInt(raw, 10) : Number(raw || 0);
          
          console.log('✅ sBTC get-balance (contract) result:', { 
            principal, 
            balance, 
            raw,
            network: isTestnet ? 'testnet' : 'mainnet' 
          });
          
          return { 
            principal, 
            balance, 
            source: 'contract', 
            network: isTestnet ? 'testnet' : 'mainnet',
            contractAddress: sbtcContractAddress,
            contractName: sbtcContractName
          };
        } catch (err) {
          console.warn('⚠️ Contract read failed, falling back to REST:', err?.message || String(err));
          
          // Fallback to REST balances scan (find any FT ending with ::sbtc)
          try {
            const apiKey = process.env.HIRO_API_KEY;
            const baseUrl = process.env.HIRO_API_URL_REST || 'https://api.hiro.so';
            const url = `${baseUrl}/extended/v1/address/${encodeURIComponent(principal)}/balances`;
            
            console.log('🔍 Attempting REST API fallback:', { url, hasApiKey: !!apiKey });
            
            const res = await fetch(url, {
              headers: apiKey && apiKey !== 'your-api-key-here' ? { 'x-api-key': apiKey } : {}
            });
            
            if (!res.ok) {
              const body = await res.text();
              console.error('❌ REST API failed:', { status: res.status, body });
              throw new Error(`Hiro REST error ${res.status}: ${body}`);
            }
            
            const json = await res.json();
            console.log('🔍 REST API response:', json);
            
            const fts = json?.fungible_tokens || {};
            const sbtcKey = Object.keys(fts).find(k => typeof k === 'string' && k.endsWith('::sbtc')) || null;
            const sbtcEntry = sbtcKey ? fts[sbtcKey] : null;
            const balance = sbtcEntry ? parseInt(sbtcEntry.balance || '0', 10) : 0;
            
            console.log('✅ sBTC balance (REST) result:', { 
              principal, 
              asset: sbtcKey, 
              balance, 
              network: isTestnet ? 'testnet' : 'mainnet',
              sbtcEntry
            });
            
            return { 
              principal, 
              balance, 
              asset: sbtcKey || 'unknown', 
              source: 'rest', 
              network: isTestnet ? 'testnet' : 'mainnet',
              contractAddress: sbtcContractAddress,
              contractName: sbtcContractName
            };
          } catch (restErr) {
            console.error('❌ REST fallback also failed:', restErr);
            
            // Final fallback: return 0 balance with error info
            return { 
              principal, 
              balance: 0, 
              source: 'fallback', 
              network: isTestnet ? 'testnet' : 'mainnet',
              error: restErr.message,
              contractAddress: sbtcContractAddress,
              contractName: sbtcContractName
            };
          }
        }
      },
      86400000 // 24 hours cache to align with holdings policy
    );

    const response = NextResponse.json({
      ...result,
      cached: true,
      cacheDuration: '24 hours',
      lastUserTxId
    });
    return addRateLimitHeaders(response, rateLimitInfo);
  } catch (error) {
    console.error('❌ API Error (user-sats-balance):', error);
    return NextResponse.json(
      { error: 'Failed to fetch user sats balance', message: error.message },
      { status: 500 }
    );
  }
}

export const GET = withCors(handler);

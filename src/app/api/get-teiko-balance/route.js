/**
 * API Route: Get Teiko Token Balance
 * 
 * PURPOSE: Fetches Teiko token balance for a user address on mainnet
 * USES: Hiro API with server-side API key for rate limit access
 * CACHE: 60-second caching to reduce API calls
 * 
 * This endpoint is used by the trading interface to show user's Teiko token balance
 * for mainnet tokens only.
 */
import { NextResponse } from 'next/server';
import { rateLimitMiddleware, addRateLimitHeaders } from '../../utils/rateLimiter';
import { withCors } from '../../utils/corsMiddleware';
import { loggedBlockchainCall } from '../../utils/cacheLogger';
import { getHiroNetworkServerSide } from '../../utils/hiro-config';

async function handler(request) {
  try {
    const { searchParams } = new URL(request.url);
    const principal = searchParams.get('principal');

    if (!principal) {
      return NextResponse.json(
        { error: 'Missing required parameter', message: 'principal is required' },
        { status: 400 }
      );
    }

    // Only allow mainnet addresses (SP prefix)
    if (!principal.startsWith('SP')) {
      return NextResponse.json(
        { error: 'Invalid network', message: 'Teiko balance is only available for mainnet addresses' },
        { status: 400 }
      );
    }

    const network = getHiroNetworkServerSide('mainnet');
    
    // Teiko token contract details
    const teikoContractAddress = 'SP1T0VY3DNXRVP6HBM75DFWW0199CR0X15PC1D81B';
    const teikoContractName = 'teiko-token-stxcity';
    
    console.log('🌐 Fetching Teiko balance for mainnet address:', {
      principal,
      contract: `${teikoContractAddress}.${teikoContractName}`
    });

    const rateLimitInfo = await rateLimitMiddleware(request, 'blockchain');
    if (!rateLimitInfo.allowed) {
      const response = NextResponse.json(
        { error: 'Rate limit exceeded', message: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
      return addRateLimitHeaders(response, rateLimitInfo);
    }

    console.log('🔁 API get-teiko-balance', { principal, network: 'mainnet' });

    const result = await loggedBlockchainCall(
      `mainnet-teiko-balance-${principal}`,
      async () => {
        try {
          console.log('🔍 Attempting contract call for Teiko balance...');
          const { fetchCallReadOnlyFunction, principalCV } = await import('@stacks/transactions');
          const chainResult = await fetchCallReadOnlyFunction({
            contractAddress: teikoContractAddress,
            contractName: teikoContractName,
            functionName: 'get-balance',
            functionArgs: [principalCV(principal)],
            network: network,
            senderAddress: principal,
          });
          
          console.log('🔍 Teiko contract call result:', chainResult);
          console.log('🔍 Result type:', typeof chainResult);
          console.log('🔍 Result constructor:', chainResult?.constructor?.name);
          console.log('🔍 Result keys:', chainResult && typeof chainResult === 'object' ? Object.keys(chainResult) : 'N/A');
          
          // Handle different response formats including BigInt
          let balance = 0;
          if (typeof chainResult === 'bigint') {
            balance = Number(chainResult);
            console.log('🔍 Parsed BigInt:', balance);
          } else if (typeof chainResult === 'number') {
            balance = chainResult;
            console.log('🔍 Parsed as number:', balance);
          } else if (typeof chainResult === 'string') {
            console.log('🔍 Parsing string result:', chainResult);
            // Handle string format like "ok u123456"
            if (chainResult.startsWith('ok u')) {
              balance = parseInt(chainResult.substring(4));
              console.log('🔍 Parsed "ok u" format:', balance);
            } else if (chainResult.startsWith('ok ')) {
              balance = parseInt(chainResult.substring(3));
              console.log('🔍 Parsed "ok " format:', balance);
            } else {
              balance = parseInt(chainResult) || 0;
              console.log('🔍 Parsed direct string:', balance);
            }
          } else if (chainResult && typeof chainResult === 'object') {
            console.log('🔍 Parsing object result:', JSON.stringify(chainResult, (key, value) => 
              typeof value === 'bigint' ? value.toString() : value, 2));
            // Handle object format
            if (chainResult.value !== undefined) {
              const value = typeof chainResult.value === 'bigint' ? Number(chainResult.value) : chainResult.value;
              balance = parseInt(value) || 0;
              console.log('🔍 Parsed from .value:', balance);
            } else if (chainResult.result !== undefined) {
              const result = typeof chainResult.result === 'bigint' ? Number(chainResult.result) : chainResult.result;
              balance = parseInt(result) || 0;
              console.log('🔍 Parsed from .result:', balance);
            } else {
              // Try to parse the object directly
              balance = parseInt(chainResult) || 0;
              console.log('🔍 Parsed object directly:', balance);
            }
          } else {
            console.log('🔍 Unknown result format, defaulting to 0');
          }
          
          // Convert from raw balance (6 decimal places) to actual token amount
          const actualBalance = balance / 1000000;
          
          console.log('✅ Teiko get-balance result:', { 
            principal, 
            rawBalance: balance,
            actualBalance,
            network: 'mainnet' 
          });
          
          return { 
            principal, 
            balance: actualBalance,
            rawBalance: balance,
            source: 'contract', 
            network: 'mainnet',
            contractAddress: teikoContractAddress,
            contractName: teikoContractName
          };
        } catch (err) {
          console.error('❌ Teiko contract read failed:', err?.message || String(err));
          
          // Return 0 balance with error info
          return { 
            principal, 
            balance: 0,
            rawBalance: 0,
            source: 'error', 
            network: 'mainnet',
            error: err.message,
            contractAddress: teikoContractAddress,
            contractName: teikoContractName
          };
        }
      },
      60000 // 60 seconds cache
    );

    const response = NextResponse.json({
      ...result,
      cached: true,
      cacheDuration: '60 seconds',
      timestamp: new Date().toISOString()
    });
    return addRateLimitHeaders(response, rateLimitInfo);
  } catch (error) {
    console.error('❌ API Error (get-teiko-balance):', error);
    return NextResponse.json(
      { error: 'Failed to fetch Teiko balance', message: error.message },
      { status: 500 }
    );
  }
}

export const GET = withCors(handler);

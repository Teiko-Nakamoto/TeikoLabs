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
          
          // Use the same parsing logic as the frontend
          const raw = chainResult?.value?.value || chainResult?.value || null;
          console.log('🔍 Teiko balance raw value:', raw);
          
          let balance = 0;
          if (raw) {
            // Convert from smallest units (6 decimal places) to whole tokens
            let rawValue = 0;
            if (typeof raw === 'bigint') {
              rawValue = Number(raw);
              console.log('🔍 Teiko balance: Converted bigint to number:', rawValue);
            } else {
              rawValue = parseInt(raw);
              console.log('🔍 Teiko balance: Parsed string to integer:', rawValue);
            }
            
            const tokensInWholeUnits = rawValue / 1000000;
            balance = Math.floor(tokensInWholeUnits);
            
            console.log('🔍 Teiko balance conversion:', {
              rawValue: rawValue,
              tokensInWholeUnits: tokensInWholeUnits,
              finalResult: balance
            });
          } else {
            console.log('🔍 No Teiko balance raw value found');
          }
          
          console.log('✅ Teiko get-balance result:', { 
            principal, 
            rawBalance: balance,
            network: 'mainnet' 
          });
          
          return { 
            principal, 
            balance: balance,
            rawBalance: balance * 1000000, // Convert back to raw units for reference
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

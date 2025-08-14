// API Route: Get Mainnet Recent Trades (Server-side with API key + 15s caching)
import { NextResponse } from 'next/server';
import { rateLimitMiddleware, addRateLimitHeaders } from '../../utils/rateLimiter';
import { withCors } from '../../utils/corsMiddleware';
import { loggedBlockchainCall } from '../../utils/cacheLogger';
import { getHiroNetworkServerSide } from '../../utils/hiro-config';

async function handler(request) {
  try {
    const { searchParams } = new URL(request.url);
    const contractAddress = searchParams.get('address');
    const contractName = searchParams.get('name');
    const limitParam = searchParams.get('limit');

    if (!contractAddress || !contractName) {
      return NextResponse.json(
        {
          error: 'Missing required parameters',
          message: 'Both address and name parameters are required'
        },
        { status: 400 }
      );
    }

    const limit = Math.min(Math.max(parseInt(limitParam || '25', 10), 1), 50);

    // Apply rate limiting
    const rateLimitInfo = await rateLimitMiddleware(request, 'blockchain');
    if (!rateLimitInfo.allowed) {
      const response = NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          retryAfter: 60
        },
        { status: 429 }
      );
      return addRateLimitHeaders(response, rateLimitInfo);
    }

    // Use Hiro Extended REST API with optional API key
    const apiKey = process.env.HIRO_API_KEY;
    // For mainnet, Extended base should be api.hiro.so (not api.mainnet.hiro.so)
    const baseUrl = process.env.HIRO_API_URL_REST || 'https://api.hiro.so';

    // 1) Read current sBTC liquidity from the DEX contract on mainnet
    let liquidityKey = 'unknown';
    try {
      const { fetchCallReadOnlyFunction } = await import('@stacks/transactions');
      const liqResult = await loggedBlockchainCall(
        `mainnet-sbtc-balance-${contractAddress}.${contractName}`,
        async () => {
          return await fetchCallReadOnlyFunction({
            contractAddress,
            contractName,
            functionName: 'get-sbtc-balance',
            functionArgs: [],
            network: getHiroNetworkServerSide('mainnet'),
            senderAddress: contractAddress,
          });
        },
        5000 // cache sBTC balance for 5s to reduce read-only spam
      );
      const rawLiq = liqResult?.value?.value ?? liqResult?.value ?? 0;
      const liqNum = typeof rawLiq === 'string' ? parseInt(rawLiq, 10) : Number(rawLiq || 0);
      liquidityKey = Number.isFinite(liqNum) ? String(liqNum) : 'unknown';
      console.log('🔁 Trades API liquidity gate:', { contractAddress, contractName, liquidityKey });
    } catch (e) {
      console.warn('⚠️ Failed to read sBTC liquidity for trades gating, proceeding with unknown key:', e?.message || String(e));
    }

    const fetchTrades = async () => {
      // Correct Extended API endpoint for contract transactions
      const contractId = `${contractAddress}.${contractName}`;
      const url = `${baseUrl}/extended/v1/tx?contract_id=${encodeURIComponent(contractId)}&limit=${limit}&sort_by=block_height&order=desc`;
      const res = await fetch(url, {
        headers: apiKey && apiKey !== 'your-api-key-here' ? { 'X-Token': apiKey } : {}
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Hiro REST error ${res.status}: ${body}`);
      }
      const json = await res.json();
      const items = Array.isArray(json.results) ? json.results : [];
      // Normalize basic trade info
      const trades = items.map(tx => ({
        txid: tx.tx_id,
        status: tx.tx_status,
        blockHeight: tx.block_height ?? null,
        timestamp: tx.burn_block_time ?? tx.block_time ?? null,
        sender: tx.sender_address ?? null,
        functionName: tx.contract_call?.function_name ?? null,
        functionArgs: tx.contract_call?.function_args ?? [],
        sponsor: tx.sponsored || false,
      }));
      console.log('✅ Trades fetched (cache-by-liquidity):', { contractId, count: trades.length, liquidityKey });
      return { trades, rawTrades: items };
    };

    // 2) Cache trades by (contract + liquidity). If liquidity doesn't change,
    //    this returns the cached result without re-fetching from Hiro.
    const result = await loggedBlockchainCall(
      `mainnet-trades-${contractAddress}.${contractName}-${liquidityKey}`,
      fetchTrades,
      86400000 // 24 hours cache; invalidated by liquidityKey change
    );

    const response = NextResponse.json({
      ...result,
      contract: { address: contractAddress, name: contractName },
      cached: true,
      cacheDuration: '24 hours (cache key = liquidity)',
      liquidityKey
    });

    return addRateLimitHeaders(response, rateLimitInfo);
  } catch (error) {
    console.error('❌ API Error (mainnet-token-trades):', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch mainnet trades',
        message: error.message
      },
      { status: 500 }
    );
  }
}

export const GET = withCors(handler);

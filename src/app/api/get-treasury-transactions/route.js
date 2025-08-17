/**
 * API Route: Get Treasury Transactions
 * 
 * PURPOSE: Fetches recent transactions for the MAS treasury contract
 * USES: Hiro API with your API key for rate limit access (900 requests/min)
 * 
 * This endpoint fetches all recent transactions involving the MAS treasury contract
 * SP1T0V0Y3DNXRVP6HBM75DFWW0199CR0X15PC1D81B.mas-sats-treasury
 */
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || 50);
    const network = searchParams.get('network') || 'mainnet';

    console.log('🔍 Fetching treasury transactions for MAS treasury contract on', network);

    // Treasury contract details
    const treasuryContractId = 'SP1T0VY3DNXRVP6HBM75DFWW0199CR0X15PC1D81B.mas-sats-treasury';
    
    if (network === 'mainnet') {
      try {
        // Use Hiro API to get recent transactions for the treasury contract
        const hiroApiUrl = `https://api.hiro.so/extended/v1/tx/?contract_id=${treasuryContractId}&limit=${limit}&sort_by=block_height&order=desc`;
        
        console.log('🌐 Fetching from Hiro API:', hiroApiUrl);
        
        const response = await fetch(hiroApiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'x-api-key': process.env.HIRO_API_KEY || ''
          },
        });

        if (!response.ok) {
          throw new Error(`Hiro API responded with status: ${response.status}`);
        }

        const data = await response.json();
        console.log('📊 Hiro API response received, processing transactions...');

        if (data.results && data.results.length > 0) {
          // Transform Hiro API transactions to our format
          const treasuryTransactions = data.results
            .filter(tx => tx.tx_status === 'success')
            .map(tx => {
              // Extract function name from contract call
              let functionName = 'unknown';
              let functionArgs = [];
              
              if (tx.contract_call) {
                functionName = tx.contract_call.function_name || 'unknown';
                functionArgs = tx.contract_call.function_args || [];
              }

              // Extract events for additional context
              const events = tx.events || [];
              const tokenTransfers = events.filter(event => 
                event.event_type === 'ft_transfer_event'
              );
              
              const stxTransfers = events.filter(event => 
                event.event_type === 'stx_transfer_event'
              );

              return {
                transaction_id: tx.tx_id,
                block_height: tx.block_height,
                block_time: tx.block_time,
                block_time_iso: tx.block_time_iso,
                sender_address: tx.sender_address,
                contract_id: tx.contract_call?.contract_id || treasuryContractId,
                function_name: functionName,
                function_args: functionArgs,
                fee_rate: tx.fee_rate,
                fee: tx.fee,
                tx_status: tx.tx_status,
                events: {
                  total: events.length,
                  token_transfers: tokenTransfers.length,
                  stx_transfers: stxTransfers.length
                },
                token_transfers: tokenTransfers.map(event => ({
                  asset_id: event.asset?.asset_id,
                  amount: event.asset?.amount,
                  sender: event.asset?.sender,
                  recipient: event.asset?.recipient
                })),
                stx_transfers: stxTransfers.map(event => ({
                  amount: event.stx_transfer_event?.amount,
                  sender: event.stx_transfer_event?.sender,
                  recipient: event.stx_transfer_event?.recipient
                })),
                network: 'mainnet'
              };
            });

          console.log(`✅ Successfully fetched ${treasuryTransactions.length} treasury transactions from Hiro API`);
          
          return NextResponse.json({ 
            transactions: treasuryTransactions,
            count: treasuryTransactions.length,
            source: 'hiro_api_mainnet',
            total_available: data.total,
            contract_id: treasuryContractId,
            network: network
          });
        } else {
          console.log('📭 No transactions found for treasury contract');
          return NextResponse.json({ 
            transactions: [],
            count: 0,
            source: 'hiro_api_mainnet',
            total_available: 0,
            contract_id: treasuryContractId,
            network: network,
            message: 'No transactions found for the treasury contract'
          });
        }
      } catch (hiroError) {
        console.log('⚠️ Hiro API failed:', hiroError.message);
        return NextResponse.json({ 
          error: 'Failed to fetch from Hiro API',
          details: hiroError.message,
          transactions: [],
          count: 0,
          contract_id: treasuryContractId,
          network: network
        }, { status: 500 });
      }
    }

    // For non-mainnet networks, return empty response
    return NextResponse.json({ 
      transactions: [],
      count: 0,
      source: 'unsupported_network',
      contract_id: treasuryContractId,
      network: network,
      message: 'Treasury transactions only available on mainnet'
    });

  } catch (error) {
    console.error('❌ Error in get-treasury-transactions API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message,
      transactions: [],
      count: 0
    }, { status: 500 });
  }
}

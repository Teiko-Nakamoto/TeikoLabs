import { supabase } from '../../utils/supabaseClient';

export async function GET() {
  const DEX_CONTRACT_ID = 'ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4.plum-aardvark-dex';

  try {
    const endpoint = `https://api.testnet.hiro.so/extended/v1/contract/${DEX_CONTRACT_ID}/events?limit=50&unanchored=true`;
    const response = await fetch(endpoint);
    const eventData = await response.json();

    if (!eventData.results || eventData.results.length === 0) {
      return new Response(JSON.stringify({ message: 'No contract events found' }), { status: 200 });
    }

    const txIds = [...new Set(eventData.results.map(event => event.tx_id))];
    const parsedTrades = [];

    for (const txId of txIds) {
      const txResponse = await fetch(`https://api.testnet.hiro.so/extended/v1/tx/${txId}`);
      const tx = await txResponse.json();

      parsedTrades.push({
        tx_id: tx.tx_id,
        transaction_type: tx.contract_call?.function_name || tx.tx_type,
        stx_fee: parseInt(tx.fee_rate || '0'),
        created_at: tx.block_time_iso,
        full_data: tx,
      });
    }

    const { data: existingData, error: fetchError } = await supabase
      .from('trades')
      .select('tx_id')
      .in('tx_id', parsedTrades.map(trade => trade.tx_id));

    if (fetchError) {
      console.error('❌ Error checking existing tx_ids:', fetchError);
      return new Response(JSON.stringify({ error: 'Supabase read error' }), { status: 500 });
    }

    const existingSet = new Set(existingData.map(row => row.tx_id));
    const newTrades = parsedTrades.filter(trade => !existingSet.has(trade.tx_id));

    let inserted = 0;
    for (const trade of newTrades) {
      const { data: insertedRows, error: insertError } = await supabase
        .from('trades')
        .insert(trade)
        .select(); // Needed to get inserted row ID

      if (!insertError && insertedRows?.[0]?.id) {
        inserted++;

        const insertedId = insertedRows[0].id;
        const tx = trade.full_data;
        await extractAndUpdateBalances(tx, insertedId); // 👈 no change
      } else {
        console.error(`❌ Insert error for ${trade.tx_id}:`, insertError);
      }
    }

    // 🔁 Backfill: update old rows missing balances or price
    const { data: incompleteRows, error: missingError } = await supabase
      .from('trades')
      .select('id, full_data')
      .or('current_stx_balance.is.null,token_balance.is.null,current_price.is.null'); // ✅ [ADDED] include price

    if (missingError) {
      console.error('❌ Error fetching incomplete rows:', missingError);
    } else {
      console.log(`🔁 Backfilling ${incompleteRows.length} old trades...`);
      for (const row of incompleteRows) {
        await extractAndUpdateBalances(row.full_data, row.id); // 👈 already does price now
      }
    }

    return new Response(JSON.stringify({ message: `Inserted ${inserted} new trades` }), { status: 200 });

  } catch (err) {
    console.error('❌ Fatal error during trade sync:', err);
    return new Response(JSON.stringify({ error: 'Fetch failed', details: err.message }), { status: 500 });
  }
}

// 🔍 Helper function to extract balances and update DB
async function extractAndUpdateBalances(tx, rowId) {
  const tradeType = tx?.contract_call?.function_name || null;
  const events = tx?.events || [];
  const smartLog = events.find(e => e.event_type === 'smart_contract_log');
  const repr = smartLog?.contract_log?.value?.repr || '';

  const stxMatch = repr.match(/\(current-stx-balance u(\d+)\)/);
  const tokenMatch = repr.match(/\(token-balance u(\d+)\)/);

  const currentStxBalance = stxMatch ? parseInt(stxMatch[1], 10) : null;
  const tokenBalance = tokenMatch ? parseInt(tokenMatch[1], 10) : null;

  // ✅ [ADDED] Calculate current price (stx / token)
  const currentPrice =
    currentStxBalance !== null && tokenBalance !== null && tokenBalance > 0
      ? currentStxBalance / tokenBalance
      : null;

  if (currentStxBalance !== null || tokenBalance !== null) {
    const { error: updateError } = await supabase
      .from('trades')
      .update({
        current_stx_balance: currentStxBalance,
        token_balance: tokenBalance,
        trade_type: tradeType,
        current_price: currentPrice, // ✅ [ADDED] save price to DB
      })
      .eq('id', rowId);

    if (updateError) {
      console.error(`❌ Failed to update balances for trade ${rowId}:`, updateError);
    } else {
      console.log(`✅ Updated trade ${rowId} with STX: ${currentStxBalance}, Token: ${tokenBalance}, Price: ${currentPrice}`); // ✅ [UPDATED LOG]
    }
  } else {
    console.warn(`⚠️ Could not extract balances for trade ${rowId}`);
  }
}

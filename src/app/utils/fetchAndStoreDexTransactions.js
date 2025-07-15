import { supabase } from './supabaseClient';

const DEX_CONTRACT_ID = 'ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4.plum-aardvark-dex';

export async function fetchAndStoreDexTransactions() {
  try {
    const endpoint = `https://api.testnet.hiro.so/extended/v1/contract/${DEX_CONTRACT_ID}/events?limit=50&unanchored=true`;
    const response = await fetch(endpoint);
    const eventData = await response.json();

    if (!eventData.results || eventData.results.length === 0) {
      console.warn('⚠️ No contract events found.');
      return;
    }

    const txIds = [...new Set(eventData.results.map(event => event.tx_id))];

    const parsedTrades = [];

    // Step 1: Fetch full transaction data for each tx_id
    for (const txId of txIds) {
      const txResponse = await fetch(`https://api.testnet.hiro.so/extended/v1/tx/${txId}`);
      const tx = await txResponse.json();

      // Extract relevant fields (can expand later)
      parsedTrades.push({
        tx_id: tx.tx_id,
        transaction_type: tx.contract_call?.function_name || tx.tx_type,
        stx_fee: parseInt(tx.fee_rate || '0'),
        created_at: tx.block_time_iso,
        full_data: tx, // optional; remove if you want to avoid large storage
      });
    }

    // Step 2: Check which tx_ids already exist
    const { data: existingData, error: fetchError } = await supabase
      .from('trades')
      .select('tx_id')
      .in('tx_id', parsedTrades.map(trade => trade.tx_id));

    if (fetchError) {
      console.error('❌ Error checking existing tx_ids:', fetchError);
      return;
    }

    const existingSet = new Set(existingData.map(row => row.tx_id));
    const newTrades = parsedTrades.filter(trade => !existingSet.has(trade.tx_id));

    console.log(`⏭️ Skipped ${parsedTrades.length - newTrades.length} existing trades`);
    console.log(`⬇️ Inserting ${newTrades.length} new trades`);

    // Step 3: Insert new trades
    for (const trade of newTrades) {
      const { error } = await supabase
        .from('trades')
        .insert(trade);

      if (error) {
        console.error(`❌ Error inserting trade with tx_id ${trade.tx_id}:`, error);
      } else {
        console.log(`✅ Inserted trade ${trade.tx_id}`);
      }
    }

    console.log(`✅ Finished processing ${parsedTrades.length} total trades`);

  } catch (err) {
    console.error('❌ Fatal error during trade sync:', err);
  }
}

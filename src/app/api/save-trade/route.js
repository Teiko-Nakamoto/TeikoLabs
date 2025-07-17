import { supabase } from '../../utils/supabaseClient';

export async function POST(req) {
  try {
    // 📨 Parse the confirmed transaction object from the frontend
    const tx = await req.json();

    // 🛑 Make sure it has a tx_id (required)
    if (!tx?.tx_id) {
      return new Response(JSON.stringify({ error: 'Missing tx_id in request' }), { status: 400 });
    }

    // ✅ Only proceed if the contract call is a 'buy' or 'sell'
    const functionName = tx.contract_call?.function_name;
    if (functionName !== 'buy' && functionName !== 'sell') {
      return new Response(JSON.stringify({ message: 'Not a buy/sell trade, skipping' }), { status: 200 });
    }

    // 📋 Prepare trade data to insert
    const trade = {
      tx_id: tx.tx_id,
      trade_type: functionName, // Only 'buy' or 'sell'
      stx_fee: parseInt(tx.fee_rate || '0'), // Fee in micro-STX
      created_at: tx.block_time_iso || new Date().toISOString(), // Timestamp when block confirmed
      full_data: tx, // Store full transaction JSON (can parse later)
    };

    // 🔍 Check if this transaction already exists in Supabase
    const { data: existing, error: fetchError } = await supabase
      .from('trades')
      .select('id')
      .eq('tx_id', trade.tx_id)
      .maybeSingle();

    if (fetchError) {
      console.error('❌ Error checking Supabase for tx_id:', fetchError);
      return new Response(JSON.stringify({ error: 'Supabase lookup failed' }), { status: 500 });
    }

    if (existing) {
      return new Response(JSON.stringify({ message: 'Trade already exists' }), { status: 200 });
    }

    // ✅ Insert new trade row into Supabase
    const { data: inserted, error: insertError } = await supabase
      .from('trades')
      .insert(trade)
      .select(); // Required to get the row ID back

    if (insertError || !inserted?.[0]?.id) {
      console.error('❌ Insert failed:', insertError);
      return new Response(JSON.stringify({ error: 'Insert failed' }), { status: 500 });
    }

    const insertedId = inserted[0].id;

    // 🔄 Now extract balances and update the row
    await extractAndUpdateBalances(tx, insertedId);

    return new Response(JSON.stringify({ message: '✅ Trade saved successfully' }), { status: 200 });

  } catch (err) {
    console.error('❌ Fatal error saving trade:', err);
    return new Response(JSON.stringify({ error: 'Unexpected error', details: err.message }), { status: 500 });
  }
}

// 🧠 Helper function to pull out token + STX balances and price from contract logs
async function extractAndUpdateBalances(tx, rowId) {
  const tradeType = tx?.contract_call?.function_name || null;
  const events = tx?.events || [];

  const smartLog = events.find(e => e.event_type === 'smart_contract_log');
  const repr = smartLog?.contract_log?.value?.repr || '';

  const stxMatch = repr.match(/\(current-stx-balance u(\d+)\)/);
  const tokenMatch = repr.match(/\(token-balance u(\d+)\)/);

  const currentStxBalance = stxMatch ? parseInt(stxMatch[1], 10) : null;
  const tokenBalance = tokenMatch ? parseInt(tokenMatch[1], 10) : null;

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
        current_price: currentPrice,
      })
      .eq('id', rowId);

    if (updateError) {
      console.error(`❌ Failed to update balances for trade ${rowId}:`, updateError);
    } else {
      console.log(`✅ Updated trade ${rowId} with STX: ${currentStxBalance}, Token: ${tokenBalance}, Price: ${currentPrice}`);
    }
  } else {
    console.warn(`⚠️ Could not extract balances for trade ${rowId}`);
  }
}

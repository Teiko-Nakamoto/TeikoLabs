import { supabase } from '../../utils/supabaseClient';

export async function POST(req) {
  try {
    const {
      transaction_id,
      price,
      expected_price,
      type,
      created_at,
      tokens_traded,
      sats_traded,
    } = await req.json();

    // ✅ Validate required fields
    if (
      !transaction_id ||
      !price ||
      !type ||
      !created_at ||
      typeof tokens_traded !== 'number'
    ) {
      return new Response(
        JSON.stringify({
          error:
            'Missing or invalid fields: transaction_id, price, type, created_at, tokens_traded.',
        }),
        { status: 400 }
      );
    }

    // ✅ Verify transaction exists and succeeded on chain
    const verifyRes = await fetch(`https://api.testnet.hiro.so/extended/v1/tx/${transaction_id}`);
    if (!verifyRes.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to verify transaction on blockchain.' }),
        { status: 400 }
      );
    }

    const txData = await verifyRes.json();
    if (txData.tx_status !== 'success') {
      return new Response(
        JSON.stringify({ error: 'Transaction not confirmed or invalid.' }),
        { status: 400 }
      );
    }

    // ✅ Extract wallet address from transaction data
    const wallet_address = txData.sender_address;
    // You may need to construct the DEX address dynamically if it changes per contract
    const dexAddress = "ST37918Q7NBZ52AMV133VTY5C864KVK0S2HZ3CGA4.dear-cyan-dex"; // update as needed

    let masSatsSwapped = null;
    let satsSwapped = null;
    let masSatsReceived = null;
    let satsReceived = null;

    for (const event of txData.events || []) {
      if (event.event_type === "fungible_token_asset") {
        // MAS Sats swapped (user -> DEX)
        if (
          event.asset.sender === wallet_address &&
          event.asset.recipient === dexAddress &&
          event.asset.asset_id.includes("dear-cyan")
        ) {
          masSatsSwapped = event.asset.amount;
        }
        // MAS Sats received (DEX -> user)
        if (
          event.asset.sender === dexAddress &&
          event.asset.recipient === wallet_address &&
          event.asset.asset_id.includes("dear-cyan")
        ) {
          masSatsReceived = event.asset.amount;
        }
        // SATS swapped (user -> DEX)
        if (
          event.asset.sender === wallet_address &&
          event.asset.recipient === dexAddress &&
          event.asset.asset_id.includes("sbtc-token")
        ) {
          satsSwapped = event.asset.amount;
        }
        // SATS received (DEX -> user)
        if (
          event.asset.sender === dexAddress &&
          event.asset.recipient === wallet_address &&
          event.asset.asset_id.includes("sbtc-token")
        ) {
          satsReceived = event.asset.amount;
        }
      }
    }

    // Now, for a buy:
    // - satsSwapped: what user sent
    // - masSatsReceived: what user received
    // For a sell:
    // - masSatsSwapped: what user sent
    // - satsReceived: what user received

    let tokens_traded_final = tokens_traded;
    let sats_traded_final = sats_traded;

    if (type === "buy") {
      if (typeof satsSwapped === "string") sats_traded_final = Number(satsSwapped);
      if (typeof masSatsReceived === "string") tokens_traded_final = Number(masSatsReceived);
    } else if (type === "sell") {
      if (typeof masSatsSwapped === "string") tokens_traded_final = -Number(masSatsSwapped); // negative for sell
      if (typeof satsReceived === "string") sats_traded_final = Number(satsReceived);
    }

    // ✅ Build trade data
    const tradeData = {
      transaction_id,
      wallet_address,
      price,
      expected_price: expected_price || null, // Add expected price for slippage tracking
      type,
      created_at,
      tokens_traded: tokens_traded_final,
      sats_traded: sats_traded_final,
    };

    // ✅ Attempt to insert (will fail if tx_id already exists)
    const { error } = await supabase
      .from('TestTrades')
      .insert([tradeData], { upsert: false }); // No overwrite allowed

    if (error) {
      if (error.message.includes('duplicate key value')) {
        return new Response(
          JSON.stringify({ error: 'Duplicate transaction_id. Not saved again.' }),
          { status: 409 }
        );
      }

      // Other errors
      console.error('❌ Supabase insert error:', error.message);
      return new Response(
        JSON.stringify({ error: `Supabase insert failed: ${error.message}` }),
        { status: 500 }
      );
    }

    console.log(`✅ Trade with txId ${transaction_id} saved successfully.`);

    return new Response(
      JSON.stringify({
        message: '✅ Trade saved successfully',
        transaction_id,
        wallet_address,
        price,
        type,
        created_at,
        tokens_traded,
        ...(typeof sats_traded === 'number' && { sats_traded }),
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error('❌ Unexpected error in save-test-trades route:', err.message);
    return new Response(
      JSON.stringify({ error: `Unexpected server error: ${err.message}` }),
      { status: 500 }
    );
  }
}

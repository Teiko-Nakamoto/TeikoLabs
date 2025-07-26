import { supabase } from '../../utils/supabaseClient';

export async function POST(req) {
  try {
    const {
      transaction_id,
      price,
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

    // ✅ Build trade data
    const tradeData = {
      transaction_id,
      wallet_address,
      price,
      type,
      created_at,
      tokens_traded,
      ...(typeof sats_traded === 'number' && { sats_traded }),
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

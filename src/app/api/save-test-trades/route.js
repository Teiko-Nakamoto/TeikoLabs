import { supabase } from '../../utils/supabaseClient';

export async function POST(req) {
  try {
    // Parse the incoming request body to get transaction data
    const { transaction_id, price, type, created_at, tokens_traded } = await req.json();

    // ✅ Validate required fields including tokens_traded
    if (!transaction_id || !price || !type || !created_at || typeof tokens_traded !== 'number') {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: transaction_id, price, type, created_at, and tokens_traded are required.' }),
        { status: 400 }
      );
    }

    // ✅ Insert trade into Supabase, including the created_at and tokens_traded fields
    const { error } = await supabase
      .from('TestTrades')
      .insert([{ transaction_id, price, type, created_at, tokens_traded }]);

    if (error) {
      console.error('❌ Supabase insert error:', error.message);
      return new Response(
        JSON.stringify({ error: `Supabase insert failed: ${error.message}` }),
        { status: 500 }
      );
    }

    // ✅ Success — respond with what was saved, including tokens_traded
    return new Response(
      JSON.stringify({
        message: '✅ Trade saved successfully',
        transaction_id,
        price,
        type,
        created_at,
        tokens_traded,
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

// /src/app/api/check-tx-duplicate/route.js

import { supabase } from '../../utils/supabaseClient';

export async function POST(req) {
  try {
    const { txid } = await req.json();

    if (!txid) {
      return new Response(JSON.stringify({ error: 'Transaction ID is required.' }), {
        status: 400,
      });
    }

    const { data, error } = await supabase
      .from('TestTrades') // Replace with your exact table name
      .select('transaction_id')
      .eq('transaction_id', txid)
      .limit(1);

    if (error) {
      throw error;
    }

    const exists = data && data.length > 0;

    return new Response(JSON.stringify({ exists }), {
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}

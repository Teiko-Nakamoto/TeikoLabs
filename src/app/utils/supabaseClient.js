// Import the Supabase client creator from the SDK
import { createClient } from '@supabase/supabase-js';

// Your unique Supabase project URL
const supabaseUrl = 'https://yivwcilvhtswlmdcjpqw.supabase.co';

// Your public anonymous API key (for client-side access)
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpdndjaWx2aHRzd2xtZGNqcHF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNjU5ODMsImV4cCI6MjA2Nzk0MTk4M30.THYtuWzFspiYPBwuJutX91GWE9zNUIMJmtG0OA_1qnc'; // ← keep this safe in .env for production

// Create and export a reusable Supabase client instance
export const supabase = createClient(supabaseUrl, supabaseKey);

// ========== 🔽 Helper function to save a trade to your Supabase table ==========
export async function saveTransaction(txId, type, tokenAmount, stxAmount, outcome, createdAt) {
  // Insert the trade data into the "transactions" table
  const { data, error } = await supabase
    .from('transactions') // target the "transactions" table
    .insert([
      {
        tx_id: txId,                 // unique transaction ID
        type: type,                  // either 'buy' or 'sell'
        token_amount: tokenAmount,  // how many tokens were traded
        stx_amount: stxAmount,      // how much STX was exchanged
        outcome: outcome,           // 'success' or 'failed'
        created_at: new Date(createdAt).toISOString(), // ISO timestamp
      }
    ]);

  // Log success or error
  if (error) {
    console.error('❌ Error saving transaction to Supabase:', error.message);
  } else {
    console.log('✅ Saved transaction to Supabase:', data);
  }
}

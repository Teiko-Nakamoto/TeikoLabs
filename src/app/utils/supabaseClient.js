// Import the Supabase client creator from the SDK
import { createClient } from '@supabase/supabase-js';

// Your unique Supabase project URL
const supabaseUrl = 'https://yivwcilvhtswlmdcjpqw.supabase.co';

// Your public anonymous API key (for client-side access)
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpdndjaWx2aHRzd2xtZGNqcHF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNjU5ODMsImV4cCI6MjA2Nzk0MTk4M30.THYtuWzFspiYPBwuJutX91GWE9zNUIMJmtG0OA_1qnc'; // ← keep this safe in .env for production

// Create and export a reusable Supabase client instance
export const supabase = createClient(supabaseUrl, supabaseKey);

// ========== 🔽 Helper function to save a trade to your Supabase table ==========
export async function saveTransaction(txId, mount, outcome, createdAt) {
  // Insert the trade data into the "transactions" table
  const { data, error } = await supabase
  .from('trades') // or 'transactions', whichever you're using
  .upsert([
    {
      tx_id: txId,
      full_data: fullData, // the raw Hiro transaction object
      created_at: new Date().toISOString()
    }
  ], {
    onConflict: 'tx_id'
  });


  // Log success or error
  if (error) {
    console.error('❌ Error saving transaction to Supabase:', error.message);
  } else {
    console.log('✅ Saved transaction to Supabase:', data);
  }
}

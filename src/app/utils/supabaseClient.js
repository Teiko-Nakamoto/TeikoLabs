// Frontend Supabase client (read-only operations only)
import { createClient } from '@supabase/supabase-js';

// Only use public URL - no sensitive credentials in frontend
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

// Create read-only client for frontend (no write operations)
export const supabase = createClient(supabaseUrl, null, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// ========== 🔽 READ-ONLY Helper functions ==========
// Note: All write operations should go through API routes

export async function getTokenCards() {
  const { data, error } = await supabase
    .from('token_cards')
    .select('*')
    .order('id');

  if (error) {
    console.error('❌ Error fetching token cards:', error.message);
    throw error;
  }

  return data || [];
}

export async function getAppSettings() {
  const { data, error } = await supabase
    .from('app_settings')
    .select('*');

  if (error) {
    console.error('❌ Error fetching app settings:', error.message);
    throw error;
  }

  return data || [];
}

// DEPRECATED: Use API routes for all write operations
// This function is kept for backward compatibility but should not be used
export async function saveTransaction(txId, mount, outcome, createdAt) {
  console.warn('⚠️ DEPRECATED: Use API routes for saving transactions');
  throw new Error('Direct database writes are disabled. Use API routes instead.');
}

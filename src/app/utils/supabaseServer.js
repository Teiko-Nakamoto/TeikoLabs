// Server-side Supabase client (for API routes only)
import { createClient } from '@supabase/supabase-js';

// Use environment variables for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Production-ready: Throw clear error if environment variables are missing
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment.'
  );
}

// Create server-side client with service role key
export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Helper functions for server-side operations (admin only)

export async function getRateLimitsServer() {
  const { data, error } = await supabaseServer
    .from('rate_limits')
    .select('*')
    .order('id');

  if (error) {
    console.error('❌ Server Error fetching rate limits:', error.message);
    throw error;
  }

  return data || [];
}

export async function saveRateLimitsServer(rateLimits) {
  // First, clear existing data
  const { error: deleteError } = await supabaseServer
    .from('rate_limits')
    .delete()
    .neq('id', 0); // Delete all rows

  if (deleteError) {
    console.error('❌ Server Error clearing rate limits:', deleteError.message);
    throw deleteError;
  }

  // Insert new rate limits
  const { data, error } = await supabaseServer
    .from('rate_limits')
    .insert(rateLimits);

  if (error) {
    console.error('❌ Server Error saving rate limits:', error.message);
    throw error;
  }

  console.log('✅ Server saved rate limits to database:', data);
  return data;
}

export async function getCorsWhitelistServer() {
  const { data, error } = await supabaseServer
    .from('cors_whitelist')
    .select('*')
    .order('id');

  if (error) {
    console.error('❌ Server Error fetching CORS whitelist:', error.message);
    throw error;
  }

  return data || [];
}

export async function addCorsUrlServer(url, adminWallet, signature, message) {
  const { data, error } = await supabaseServer
    .from('cors_whitelist')
    .insert({
      url: url,
      admin_wallet: adminWallet,
      signature: signature,
      message: message,
      created_at: new Date().toISOString()
    });

  if (error) {
    console.error('❌ Server Error adding CORS URL:', error.message);
    throw error;
  }

  console.log('✅ Server added CORS URL to database:', data);
  return data;
}

export async function removeCorsUrlServer(id, adminWallet, signature, message) {
  const { data, error } = await supabaseServer
    .from('cors_whitelist')
    .delete()
    .eq('id', id)
    .eq('admin_wallet', adminWallet);

  if (error) {
    console.error('❌ Server Error removing CORS URL:', error.message);
    throw error;
  }

  console.log('✅ Server removed CORS URL from database:', data);
  return data;
}

export async function getTokenCardsServer() {
  const { data, error } = await supabaseServer
    .from('token_cards')
    .select('*')
    .order('id');

  if (error) {
    console.error('❌ Server Error fetching token cards:', error.message);
    throw error;
  }

  // Transform database format to frontend format
  const transformedData = (data || []).map(card => ({
    id: card.id,
    isComingSoon: card.is_coming_soon || false,
    isHidden: card.is_hidden || false,
    tabType: card.tab_type || 'featured',
    dexInfo: card.dex_info || '',
    tokenInfo: card.token_info || '',
    symbol: card.symbol || '',
    revenue: card.revenue || 0,
    liquidity: card.liquidity || 0,
    network: card.network || 'testnet',
    metadataUri: card.metadata_uri || null,
    imageUrl: card.image_url || null
  }));

  return transformedData;
}

export async function saveTokenCardsServer(tokenCards, defaultTab) {
  // First, clear existing data
  const { error: deleteError } = await supabaseServer
    .from('token_cards')
    .delete()
    .neq('id', 0); // Delete all rows

  if (deleteError) {
    console.error('❌ Server Error clearing token cards:', deleteError.message);
    throw deleteError;
  }

  // Transform frontend data to database format
  const transformedCards = tokenCards.map(card => ({
    id: card.id,
    is_coming_soon: card.isComingSoon || false,
    is_hidden: card.isHidden || false,
    tab_type: card.tabType || 'featured',
    dex_info: card.dexInfo || '',
    token_info: card.tokenInfo || '',
    symbol: card.symbol || '',
    revenue: card.revenue || 0,
    liquidity: card.liquidity || 0,
    network: card.network || 'testnet',
    metadata_uri: card.metadataUri || null,
    image_url: card.imageUrl || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));

  console.log('🔄 Transformed data:', transformedCards);

  // Insert transformed data
  const { data, error } = await supabaseServer
    .from('token_cards')
    .insert(transformedCards);

  if (error) {
    console.error('❌ Server Error saving token cards:', error.message);
    throw error;
  }

  // Save default tab setting (with error handling for missing table)
  try {
    const { error: tabError } = await supabaseServer
      .from('app_settings')
      .upsert([
        {
          key: 'default_tab',
          value: defaultTab,
          updated_at: new Date().toISOString()
        }
      ], {
        onConflict: 'key'
      });

    if (tabError) {
      console.warn('⚠️ Could not save default tab (table may not exist):', tabError.message);
      // Don't throw error - this is optional
    }
  } catch (error) {
    console.warn('⚠️ Could not save default tab:', error.message);
    // Don't throw error - this is optional
  }

  console.log('✅ Server saved token cards and default tab');
  return data;
}

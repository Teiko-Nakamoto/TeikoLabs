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
    isComingSoon: !!card.is_coming_soon,
    isHidden: !!card.is_hidden,
    tabType: card.tab_type || 'featured',
    dexInfo: card.dex_info || '',
    tokenInfo: card.token_info || '',
    symbol: card.symbol || '',
    revenue: Number(card.revenue) || 0,
    liquidity: Number(card.liquidity) || 0,
    network: card.tab_type === 'featured' ? 'mainnet' : (card.network || 'testnet'),
    metadataUri: card.metadata_uri || null,
    imageUrl: card.image_url || null
  }));

  return transformedData;
}

export async function saveTokenCardsServer(tokenCards, defaultTab) {
  // Transform frontend data to database format
  const transformedCards = tokenCards.map(card => {
    // Coerce numbers and sanitize fields to avoid DB type errors
    const revenueNum = Number(card.revenue);
    const liquidityNum = Number(card.liquidity);
    const tabType = card.tabType || 'featured';
    const network = tabType === 'featured' ? 'mainnet' : 'testnet';

    return {
      id: card.id,
      is_coming_soon: !!card.isComingSoon,
      is_hidden: !!card.isHidden,
      tab_type: tabType,
      dex_info: (card.dexInfo || '').trim(),
      token_info: (card.tokenInfo || '').trim(),
      symbol: (card.symbol || '').trim(),
      revenue: Number.isFinite(revenueNum) ? revenueNum : 0,
      liquidity: Number.isFinite(liquidityNum) ? liquidityNum : 0,
      network,
      metadata_uri: card.metadataUri || null,
      image_url: card.imageUrl || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  });

  console.log('🔄 Transformed data (upsert):', transformedCards);

  // Upsert by id to avoid wiping table
  const { data, error } = await supabaseServer
    .from('token_cards')
    .upsert(transformedCards, { onConflict: 'id' });

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

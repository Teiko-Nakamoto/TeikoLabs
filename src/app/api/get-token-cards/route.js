import { NextResponse } from 'next/server';
import { supabase } from '../../utils/supabaseClient';

export async function GET() {
  try {
    // Fetch token cards from Supabase
    const { data, error } = await supabase
      .from('token_cards')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching token cards:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform the data to match the frontend format
    const tokenCards = data.map(card => ({
      id: card.id,
      isComingSoon: card.is_coming_soon,
      isHidden: card.is_hidden || false,
      tabType: card.tab_type || 'featured',
      dexInfo: card.dex_info,
      tokenInfo: card.token_info,
      symbol: card.symbol,
      revenue: card.revenue,
      liquidity: card.liquidity
    }));

    // Fetch default tab setting
    const { data: tabData, error: tabError } = await supabase
      .from('page_settings')
      .select('value')
      .eq('key', 'default_tab')
      .single();

    let defaultTab = 'featured'; // Default fallback
    if (!tabError && tabData) {
      defaultTab = tabData.value;
    }

    return NextResponse.json({ tokenCards, defaultTab });
  } catch (error) {
    console.error('Error in get-token-cards API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
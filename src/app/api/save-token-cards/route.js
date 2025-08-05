import { NextResponse } from 'next/server';
import { supabase } from '../../utils/supabaseClient';

export async function POST(request) {
  try {
    console.log('📝 API: Starting save-token-cards request');
    
    const { tokenCards, defaultTab } = await request.json();
    console.log('📝 API: Received data:', { tokenCards, defaultTab });
    
    if (!tokenCards || !Array.isArray(tokenCards)) {
      console.error('❌ API: Invalid tokenCards data:', tokenCards);
      return NextResponse.json({ error: 'Invalid tokenCards data' }, { status: 400 });
    }
    
    // Save token cards to Supabase
    console.log('📝 API: Saving token cards to Supabase...');
    const { data, error } = await supabase
      .from('token_cards')
      .upsert(
        tokenCards.map(card => ({
          id: card.id,
          is_coming_soon: card.isComingSoon,
          tab_type: card.tabType || 'featured',
          dex_info: card.dexInfo,
          token_info: card.tokenInfo,
          symbol: card.symbol,
          revenue: card.revenue,
          liquidity: card.liquidity,
          updated_at: new Date().toISOString()
        })),
        { onConflict: 'id' }
      );

    if (error) {
      console.error('❌ API: Error saving token cards:', error);
      return NextResponse.json({ 
        error: error.message, 
        details: error.details,
        hint: error.hint 
      }, { status: 500 });
    }

    console.log('✅ API: Token cards saved successfully:', data);

    // Save default tab setting
    if (defaultTab) {
      console.log('📝 API: Saving default tab setting...');
      const { error: tabError } = await supabase
        .from('page_settings')
        .upsert(
          [{ 
            key: 'default_tab', 
            value: defaultTab,
            updated_at: new Date().toISOString()
          }],
          { onConflict: 'key' }
        );

      if (tabError) {
        console.error('❌ API: Error saving default tab:', tabError);
        return NextResponse.json({ 
          error: tabError.message,
          details: tabError.details,
          hint: tabError.hint
        }, { status: 500 });
      }
      
      console.log('✅ API: Default tab saved successfully');
    }

    console.log('✅ API: All data saved successfully');
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('❌ API: Unexpected error in save-token-cards API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error.message 
    }, { status: 500 });
  }
} 
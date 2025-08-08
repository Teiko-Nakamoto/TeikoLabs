import { NextResponse } from 'next/server';
import { getTokenCardsServer, supabaseServer } from '../../utils/supabaseServer';

export async function GET() {
  try {
    console.log('📝 API: Fetching token cards from database');
    
    // Use server-side Supabase client
    const tokenCards = await getTokenCardsServer();
    
    // Get default tab setting (with error handling for missing table)
    let defaultTab = 'featured'; // Default fallback
    try {
      const { data: settings } = await supabaseServer
        .from('app_settings')
        .select('value')
        .eq('key', 'default_tab')
        .single();
      
      if (settings?.value) {
        defaultTab = settings.value;
      }
    } catch (error) {
      console.warn('⚠️ Could not fetch default tab (table may not exist):', error.message);
      // Use default fallback
    }
    
    console.log('✅ API: Successfully fetched token cards:', tokenCards.length);
    
    return NextResponse.json({
      tokenCards,
      defaultTab
    });
    
  } catch (error) {
    console.error('❌ API: Error fetching token cards:', error);
    return NextResponse.json({ 
      error: 'Database error', 
      message: error.message 
    }, { status: 500 });
  }
} 
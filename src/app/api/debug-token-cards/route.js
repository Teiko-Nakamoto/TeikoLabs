import { NextResponse } from 'next/server';
import { supabase } from '../../utils/supabaseClient';

export async function GET() {
  try {
    console.log('🔍 Debug: Checking token cards in database...');
    
    // Fetch all token cards from Supabase
    const { data, error } = await supabase
      .from('token_cards')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('❌ Debug: Error fetching token cards:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('✅ Debug: Found token cards:', data);
    
    // Also check page settings
    const { data: tabData, error: tabError } = await supabase
      .from('page_settings')
      .select('*');

    console.log('✅ Debug: Page settings:', tabData);

    return NextResponse.json({ 
      success: true, 
      tokenCards: data, 
      pageSettings: tabData,
      tokenCardsCount: data ? data.length : 0
    });
  } catch (error) {
    console.error('❌ Debug: Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
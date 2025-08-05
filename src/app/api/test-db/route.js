import { NextResponse } from 'next/server';
import { supabase } from '../../utils/supabaseClient';

export async function GET() {
  try {
    console.log('🔍 Testing database connection and tables...');
    
    // Test token_cards table
    console.log('🔍 Testing token_cards table...');
    const { data: tokenCardsData, error: tokenCardsError } = await supabase
      .from('token_cards')
      .select('*')
      .limit(1);
    
    if (tokenCardsError) {
      console.error('❌ token_cards table error:', tokenCardsError);
      return NextResponse.json({ 
        error: 'token_cards table not accessible',
        details: tokenCardsError.message,
        hint: 'Please run the SQL setup in your Supabase dashboard'
      }, { status: 500 });
    }
    
    console.log('✅ token_cards table accessible');
    
    // Test page_settings table
    console.log('🔍 Testing page_settings table...');
    const { data: pageSettingsData, error: pageSettingsError } = await supabase
      .from('page_settings')
      .select('*')
      .limit(1);
    
    if (pageSettingsError) {
      console.error('❌ page_settings table error:', pageSettingsError);
      return NextResponse.json({ 
        error: 'page_settings table not accessible',
        details: pageSettingsError.message,
        hint: 'Please run the SQL setup in your Supabase dashboard'
      }, { status: 500 });
    }
    
    console.log('✅ page_settings table accessible');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database tables are accessible',
      tokenCardsCount: tokenCardsData?.length || 0,
      pageSettingsCount: pageSettingsData?.length || 0
    });
    
  } catch (error) {
    console.error('❌ Database test error:', error);
    return NextResponse.json({ 
      error: 'Database connection failed',
      message: error.message 
    }, { status: 500 });
  }
} 
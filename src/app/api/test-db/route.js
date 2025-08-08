import { NextResponse } from 'next/server';
import { supabaseServer } from '../../utils/supabaseServer';

export async function GET() {
  try {
    console.log('🔍 Testing database connection...');

    // Test basic connection by fetching a simple query
    const { data, error } = await supabaseServer
      .from('token_cards')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Database connection test failed:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        message: 'Database connection failed'
      }, { status: 500 });
    }

    console.log('✅ Database connection test successful');

    return NextResponse.json({ 
      success: true, 
      message: 'Database connection successful',
      data: data
    });

  } catch (error) {
    console.error('❌ Unexpected error in test-db:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 
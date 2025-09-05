import { NextResponse } from 'next/server';
import { supabaseServer } from '../../utils/supabaseServer';

export async function GET() {
  try {
    console.log('🔍 Debug: Checking all quizzes in database');
    
    // Get all quizzes without any filters
    const { data, error } = await supabaseServer
      .from('quizzes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Database error', 
        details: error 
      }, { status: 500 });
    }

    console.log('✅ Debug: Found quizzes:', data?.length || 0);
    console.log('📊 Quiz data:', data);

    return NextResponse.json({ 
      success: true, 
      quizCount: data?.length || 0,
      quizzes: data || [],
      message: `Found ${data?.length || 0} quizzes in database`
    });
    
  } catch (error) {
    console.error('❌ Debug error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Debug failed', 
      message: error.message 
    }, { status: 500 });
  }
}


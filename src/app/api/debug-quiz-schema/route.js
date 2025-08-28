import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../utils/supabaseServer';

export async function GET() {
  try {
    console.log('🔍 Debug: Checking quiz table schema');
    
    // Try to get one quiz to see the structure
    const { data, error } = await supabaseServer
      .from('quizzes')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Schema check error:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Schema check failed', 
        details: error 
      }, { status: 500 });
    }

    // Check if is_visible column exists
    const hasIsVisible = data && data.length > 0 && 'is_visible' in data[0];
    
    console.log('✅ Schema check complete');
    console.log('📊 Has is_visible column:', hasIsVisible);
    console.log('📊 Sample quiz structure:', data[0]);

    return NextResponse.json({ 
      success: true, 
      hasIsVisibleColumn: hasIsVisible,
      sampleQuiz: data[0] || null,
      message: `Schema check complete. is_visible column: ${hasIsVisible ? 'EXISTS' : 'MISSING'}`
    });
    
  } catch (error) {
    console.error('❌ Schema debug error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Schema debug failed', 
      message: error.message 
    }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../utils/supabaseServer';

export async function POST() {
  try {
    console.log('🔄 Force resetting quiz competition status to active...');
    
    // Force update quiz competition status to 'active'
    const { error: statusError } = await supabaseServer
      .from('quiz_competition_status')
      .upsert({ 
        status: 'active',
        updated_at: new Date().toISOString()
      });
    
    if (statusError) {
      console.error('❌ Error updating quiz status:', statusError);
      throw statusError;
    }
    
    console.log('✅ Quiz competition status force reset to active');
    
    return NextResponse.json({
      success: true,
      message: 'Quiz competition status force reset to active. Competition is now running again.'
    });
    
  } catch (error) {
    console.error('❌ API: Error force resetting quiz status:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to force reset quiz status',
      message: error.message
    }, { status: 500 });
  }
}


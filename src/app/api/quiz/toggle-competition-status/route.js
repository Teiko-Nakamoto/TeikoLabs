import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../utils/supabaseServer';

export async function POST(request) {
  try {
    const { status } = await request.json();
    
    if (!status || !['active', 'ended'].includes(status)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid status. Must be "active" or "ended".' 
      }, { status: 400 });
    }
    
    console.log(`🔄 Toggling quiz competition status to: ${status}`);
    
    // Update quiz competition status
    const { error: statusError } = await supabaseServer
      .from('quiz_competition_status')
      .upsert({ 
        status: status,
        updated_at: new Date().toISOString()
      });
    
    if (statusError) {
      console.error('❌ Error updating quiz status:', statusError);
      throw statusError;
    }
    
    console.log(`✅ Quiz competition status updated to: ${status}`);
    
    return NextResponse.json({
      success: true,
      status: status,
      message: `Quiz competition ${status === 'active' ? 'activated' : 'ended'} successfully.`
    });
    
  } catch (error) {
    console.error('❌ API: Error toggling competition status:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to toggle competition status',
      message: error.message
    }, { status: 500 });
  }
}


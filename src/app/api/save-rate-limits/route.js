import { NextResponse } from 'next/server';
import { saveRateLimitsServer } from '../../utils/supabaseServer';
import { requireAdminAuth } from '../../utils/adminAuth';

async function handler(request) {
  try {
    const { rateLimits } = await request.json();
    
    if (!rateLimits || !Array.isArray(rateLimits)) {
      return NextResponse.json({ 
        error: 'Invalid rate limits data' 
      }, { status: 400 });
    }

    console.log('💾 API: Saving rate limits...');
    
    await saveRateLimitsServer(rateLimits);
    
    console.log('✅ API: Rate limits saved successfully');
    return NextResponse.json({ 
      success: true, 
      message: 'Rate limits saved successfully' 
    });
    
  } catch (error) {
    console.error('❌ API: Failed to save rate limits:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save rate limits',
        details: error.message
      },
      { status: 500 }
    );
  }
}

export const POST = requireAdminAuth(handler);

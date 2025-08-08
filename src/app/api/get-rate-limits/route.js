import { NextResponse } from 'next/server';
import { getRateLimitsServer } from '../../utils/supabaseServer';
import { requireAdminAuth } from '../../utils/adminAuth';

async function handler(request) {
  try {
    console.log('🔍 API: Getting rate limits...');
    
    const rateLimits = await getRateLimitsServer();
    
    console.log('✅ API: Rate limits retrieved successfully');
    return NextResponse.json({ rateLimits });
    
  } catch (error) {
    console.error('❌ API: Failed to get rate limits:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get rate limits',
        details: error.message
      },
      { status: 500 }
    );
  }
}

export const GET = requireAdminAuth(handler);

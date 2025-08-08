import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '../../utils/adminAuth';
import { saveTokenCardsServer } from '../../utils/supabaseServer';

export async function POST(request) {
  // Verify admin authentication first
  const authResult = await verifyAdminAuth(request);
  if (!authResult.isValid) {
    console.error('❌ API: Unauthorized access attempt:', authResult.error);
    return NextResponse.json({ 
      error: 'Unauthorized', 
      message: authResult.error 
    }, { status: 401 });
  }

  console.log('✅ API: Admin authenticated:', authResult.adminAddress);
  
  try {
    console.log('📝 API: Starting save-token-cards request');
    const { tokenCards, defaultTab } = await request.json();

    if (!tokenCards || !Array.isArray(tokenCards)) {
      return NextResponse.json({ 
        error: 'Invalid data', 
        message: 'tokenCards must be an array' 
      }, { status: 400 });
    }

    // Use server-side Supabase client
    await saveTokenCardsServer(tokenCards, defaultTab);

    console.log('✅ API: Successfully saved token cards');
    return NextResponse.json({ 
      success: true, 
      message: 'Token cards saved successfully',
      count: tokenCards.length
    });

  } catch (error) {
    console.error('❌ API: Error saving token cards:', error);
    return NextResponse.json({ 
      error: 'Database error', 
      message: error.message 
    }, { status: 500 });
  }
} 
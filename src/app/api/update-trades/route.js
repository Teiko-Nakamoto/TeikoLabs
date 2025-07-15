// This imports Next.js's built-in response helper for API routes
import { NextResponse } from 'next/server';

// This imports your custom function that fetches and stores DEX trade data
import { fetchAndStoreDexTransactions } from '../../utils/fetchAndStoreDexTransactions';


// This function will run when someone sends a GET request to /api/update-trades
export async function GET() {
  try {
    // Calls the function that pulls trades from the blockchain and saves them to the Supabase database
    await fetchAndStoreDexTransactions();

    // If successful, return a JSON response that says it worked
    return NextResponse.json({ success: true, message: 'Trades updated' });
  } catch (error) {
    // If something goes wrong, log the error so we can debug it in the terminal or server logs
    console.error('❌ API failed to update trades:', error);

    // Return an error message and a 500 (server error) status
    return NextResponse.json(
      { success: false, message: 'Trade update failed' },
      { status: 500 }
    );
  }
}

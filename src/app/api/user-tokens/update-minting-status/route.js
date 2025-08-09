import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../utils/supabaseServer';

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('🔍 API received minting status update:', JSON.stringify(body, null, 2));
    
    const {
      tokenContractAddress,
      mintingCompleted
    } = body;

    // Validate required fields
    if (!tokenContractAddress || mintingCompleted === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: tokenContractAddress and mintingCompleted' },
        { status: 400 }
      );
    }

    console.log('🔄 Updating token minting status:', {
      tokenContractAddress,
      mintingCompleted
    });

    // Prepare update data - only the boolean flag we need
    const updateData = {
      minting_completed: mintingCompleted,
      updated_at: new Date().toISOString()
    };

    // Update the token record with minting status
    const { data: updatedToken, error: updateError } = await supabaseServer
      .from('user_tokens')
      .update(updateData)
      .eq('token_contract_address', tokenContractAddress)
      .select()
      .single();

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update token minting status' },
        { status: 500 }
      );
    }

    if (!updatedToken) {
      return NextResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      );
    }

    console.log('✅ Minting status updated successfully:', {
      id: updatedToken.id,
      symbol: updatedToken.token_symbol,
      mintingCompleted: updatedToken.minting_completed
    });

          // Auto-create token card in admin table for home page display
      try {
        console.log('🔄 Creating token card for home page display...');
        console.log('🔍 Updated token data:', {
          id: updatedToken.id,
          network: updatedToken.network,
          token_name: updatedToken.token_name,
          token_symbol: updatedToken.token_symbol,
          token_contract_address: updatedToken.token_contract_address,
          dex_contract_address: updatedToken.dex_contract_address
        });
        
        // User-created projects will be stored with their network info but shown in "All Projects" tab
        // We'll use a special tab_type to identify them for filtering
        // Default to testnet if network is not set
        const networkValue = updatedToken.network || 'testnet';
        const tabType = networkValue === 'mainnet' ? 'user_created_mainnet' : 'user_created_testnet';
        console.log('🔍 Determined tab_type:', tabType, 'from network:', networkValue);
        
        // Create token card data - only essential info when minting is completed
        const tokenCardData = {
          symbol: updatedToken.token_symbol,               // token initials [[memory:5517157]]
          token_info: updatedToken.token_contract_address,  // project address
          dex_info: updatedToken.dex_contract_address,      // project treasury address
          tab_type: tabType, // for filtering in "All Projects" tab
          is_coming_soon: false // Project is active since minting is completed
        };

      console.log('📋 Token card data:', tokenCardData);

      // Insert into token_cards table
      const { data: newTokenCard, error: tokenCardError } = await supabaseServer
        .from('token_cards')
        .insert([tokenCardData])
        .select()
        .single();

      if (tokenCardError) {
        console.error('❌ Failed to create token card:', tokenCardError);
        // Don't fail the whole request, just log the error
      } else {
        console.log('✅ Token card created successfully:', {
          id: newTokenCard.id,
          tabType: newTokenCard.tab_type,
          tokenInfo: newTokenCard.token_info,
          dexInfo: newTokenCard.dex_info
        });
      }
    } catch (error) {
      console.error('❌ Error creating token card:', error);
      console.error('❌ Error details:', error.message);
      console.error('❌ Error stack:', error.stack);
      // Don't fail the whole request, just log the error
    }

    return NextResponse.json({
      success: true,
      token: {
        id: updatedToken.id,
        tokenName: updatedToken.token_name,
        tokenSymbol: updatedToken.token_symbol,
        tokenContractAddress: updatedToken.token_contract_address,
        dexContractAddress: updatedToken.dex_contract_address,
        mintingCompleted: updatedToken.minting_completed,
        updatedAt: updatedToken.updated_at
      }
    });

  } catch (error) {
    console.error('❌ Error updating minting status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

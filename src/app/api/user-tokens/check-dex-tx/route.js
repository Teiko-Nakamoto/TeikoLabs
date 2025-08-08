import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { STACKS_TESTNET, STACKS_MAINNET } from '@stacks/network';

// Function to verify if a transaction exists on the blockchain
async function verifyTransactionExists(txId, network = 'testnet') {
  try {
    const baseUrl = network === 'mainnet' 
      ? 'https://api.hiro.so'
      : 'https://api.testnet.hiro.so';
    
    const response = await fetch(`${baseUrl}/extended/v1/tx/${txId}`, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (response.ok) {
      const txData = await response.json();
      console.log('✅ Transaction verification successful:', {
        txId,
        status: txData.tx_status,
        type: txData.tx_type
      });
      return {
        exists: true,
        status: txData.tx_status,
        type: txData.tx_type,
        data: txData
      };
    } else {
      console.log('❌ Transaction not found on blockchain:', txId);
      return { exists: false };
    }
  } catch (error) {
    console.error('❌ Error verifying transaction:', error);
    return { exists: false, error: error.message };
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    console.log('🔍 API: check-dex-tx endpoint called');
    const body = await request.json();
    console.log('🔍 API checking for existing DEX transaction:', JSON.stringify(body, null, 2));
    
    const { transactionId } = body;

    // Validate required field
    if (!transactionId) {
      return NextResponse.json(
        { error: 'Missing required field: transactionId' },
        { status: 400 }
      );
    }

    console.log('🔍 Checking for existing DEX deployment for transaction:', transactionId);

    // First, let's see ALL tokens with this deployment transaction hash
    const { data: allTokensWithTx, error: allTokensError } = await supabase
      .from('user_tokens')
      .select('id, token_name, token_symbol, token_contract_address, dex_contract_address, dex_deployment_tx_hash, deployment_tx_hash, created_at')
      .eq('deployment_tx_hash', transactionId)
      .order('created_at', { ascending: false });

    if (allTokensError) {
      console.error('Database search error (all tokens):', allTokensError);
    } else {
      console.log('🔍 All tokens found with this deployment transaction:', allTokensWithTx);
    }

    // Check if there's already a DEX transaction hash for a token with this deployment transaction
    // Note: Check for both NULL and empty string values
    const { data: existingToken, error: searchError } = await supabase
      .from('user_tokens')
      .select('id, token_name, token_symbol, token_contract_address, dex_contract_address, dex_deployment_tx_hash, deployment_tx_hash, created_at')
      .eq('deployment_tx_hash', transactionId)
      .not('dex_deployment_tx_hash', 'is', null)
      .not('dex_deployment_tx_hash', 'eq', '')
      .order('created_at', { ascending: false })
      .single();

    if (searchError && searchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Database search error:', searchError);
      return NextResponse.json(
        { error: 'Failed to check for existing DEX transaction' },
        { status: 500 }
      );
    }

    if (existingToken) {
      console.log('🔍 Found database record with DEX transaction:', {
        tokenId: existingToken.id,
        tokenSymbol: existingToken.token_symbol,
        dexTxHash: existingToken.dex_deployment_tx_hash
      });

      // Verify the DEX transaction actually exists on the blockchain
      console.log('🔍 Verifying DEX transaction on blockchain...');
      const txVerification = await verifyTransactionExists(existingToken.dex_deployment_tx_hash, 'testnet');
      
      if (txVerification.exists) {
        console.log('✅ DEX transaction verified on blockchain:', existingToken.dex_deployment_tx_hash);
        
        return NextResponse.json({
          exists: true,
          verified: true,
          token: {
            id: existingToken.id,
            tokenName: existingToken.token_name,
            tokenSymbol: existingToken.token_symbol,
            tokenContractAddress: existingToken.token_contract_address,
            dexContractAddress: existingToken.dex_contract_address,
            dexDeploymentTxHash: existingToken.dex_deployment_tx_hash,
            deploymentTxHash: existingToken.deployment_tx_hash
          },
          blockchainData: {
            status: txVerification.status,
            type: txVerification.type
          }
        });
      } else {
        console.log('❌ DEX transaction NOT found on blockchain - invalid/fake transaction:', existingToken.dex_deployment_tx_hash);
        console.log('🗑️ This record should be cleaned up manually or automatically');
        
        return NextResponse.json({
          exists: false,
          verified: false,
          message: 'Found database record but DEX transaction does not exist on blockchain',
          invalidRecord: {
            id: existingToken.id,
            tokenSymbol: existingToken.token_symbol,
            fakeDexTxHash: existingToken.dex_deployment_tx_hash
          }
        });
      }
    }

    console.log('❌ No existing DEX transaction found for:', transactionId);
    return NextResponse.json({
      exists: false,
      message: 'No existing DEX transaction found for this deployment'
    });

  } catch (error) {
    console.error('❌ Error checking DEX transaction:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

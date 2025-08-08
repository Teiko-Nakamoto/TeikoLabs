#!/usr/bin/env node

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.log('Please ensure you have the following in your .env.local file:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupUserTokensTable() {
  console.log('🏗️  Setting up User Tokens Table...\n');

  try {
    // Read the SQL schema
    const schemaPath = path.join(process.cwd(), 'user-tokens-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('📋 SQL Schema loaded successfully');
    console.log('📊 Creating user_tokens table...\n');

    // Execute the SQL schema
    const { error } = await supabase.rpc('exec_sql', { sql: schema });

    if (error) {
      console.error('❌ Error creating table:', error.message);
      console.log('\n🔧 Manual Setup Required:');
      console.log('1. Go to your Supabase Dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Copy and paste the contents of user-tokens-schema.sql');
      console.log('4. Execute the SQL');
      return;
    }

    console.log('✅ User tokens table created successfully!');
    console.log('✅ Indexes created for performance');
    console.log('✅ Triggers set up for automatic timestamps');

    // Test the table by checking if it exists
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'user_tokens');

    if (tableError) {
      console.error('❌ Error verifying table:', tableError.message);
    } else if (tables && tables.length > 0) {
      console.log('✅ Table verification successful');
    }

    console.log('\n🎉 User Tokens System Setup Complete!');
    console.log('\n📋 Available API Endpoints:');
    console.log('- POST /api/user-tokens/create - Create new user token');
    console.log('- GET /api/user-tokens/list - List all user tokens');
    console.log('- GET /api/user-tokens/[id] - Get specific user token');
    console.log('- PUT /api/user-tokens/[id] - Update user token');

    console.log('\n🔧 Next Steps:');
    console.log('1. Create the token creation UI');
    console.log('2. Integrate with Stacks wallet for deployment');
    console.log('3. Add token verification system');
    console.log('4. Create user token management dashboard');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\n🔧 Manual Setup Required:');
    console.log('1. Go to your Supabase Dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the contents of user-tokens-schema.sql');
    console.log('4. Execute the SQL');
  }
}

// Run the setup
setupUserTokensTable();

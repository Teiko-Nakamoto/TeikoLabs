#!/usr/bin/env node

/**
 * Setup script for CORS Whitelist Management
 * This script creates the cors_whitelist table in your Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupCorsTable() {
  try {
    console.log('🔧 Setting up CORS whitelist table...');
    
    // Read the SQL schema
    const schemaPath = path.join(process.cwd(), 'cors-table-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📋 SQL Schema to execute:');
    console.log(schema);
    console.log('\n');
    
    // Note: Supabase doesn't allow direct SQL execution via client
    // You'll need to run this in the Supabase dashboard
    console.log('💡 To create the CORS table:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to the SQL Editor');
    console.log('3. Copy and paste the SQL schema above');
    console.log('4. Click "Run" to execute the SQL');
    console.log('\n');
    
    // Test if table exists
    console.log('🔍 Testing if cors_whitelist table exists...');
    const { data, error } = await supabase
      .from('cors_whitelist')
      .select('count')
      .limit(1);
    
    if (error) {
      if (error.message.includes('relation "cors_whitelist" does not exist')) {
        console.log('❌ Table does not exist yet. Please run the SQL schema in your Supabase dashboard.');
      } else {
        console.error('❌ Database error:', error.message);
      }
    } else {
      console.log('✅ CORS whitelist table exists and is accessible!');
      
      // Test inserting a sample record
      console.log('🧪 Testing table functionality...');
      const { data: testData, error: testError } = await supabase
        .from('cors_whitelist')
        .select('*')
        .limit(5);
      
      if (testError) {
        console.error('❌ Error testing table:', testError.message);
      } else {
        console.log(`✅ Table is working! Found ${testData.length} existing records.`);
      }
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup
setupCorsTable();

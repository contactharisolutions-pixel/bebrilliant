// supabase_client.js — Supabase Storage & Database Client
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('CRITICAL: Supabase credentials missing in ENV');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;

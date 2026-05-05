import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function getEnvVar(name) {
  const envPath = path.resolve(process.cwd(), '.env');
  const content = fs.readFileSync(envPath, 'utf8');
  const match = content.match(new RegExp(`^${name}=(.*)$`, 'm'));
  return match ? match[1].trim() : null;
}

const supabaseUrl = getEnvVar('SUPABASE_URL');
const supabaseServiceRoleKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY');

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

async function run() {
  try {
    console.log('Ensuring storage bucket "bebrilliant" exists...');
    const { data, error } = await supabaseAdmin.storage.createBucket('bebrilliant', {
      public: true
    });

    if (error) {
      if (error.message.includes('already exists')) {
        console.log('Bucket "bebrilliant" already exists.');
      } else {
        throw error;
      }
    } else {
      console.log('Bucket "bebrilliant" created successfully.');
    }
  } catch (err) {
    console.error('Error creating bucket:', err.message);
  }
}

run();

import pg from 'pg';
import fs from 'fs';
import path from 'path';

const newDbUrl = 'postgresql://postgres:Life@20242526@db.zgcmncootfkygzeebnhv.supabase.co:5432/postgres';
const migrationsDir = path.resolve(process.cwd(), 'supabase/migrations');

async function run() {
  const client = new pg.Client({ connectionString: newDbUrl });
  try {
    await client.connect();
    console.log('Connected to NEW database.');

    // Optional: Reset schema for a clean start
    console.log('Resetting public schema...');
    await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO postgres; GRANT ALL ON SCHEMA public TO public;');
    console.log('Schema reset complete.');

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`Found ${files.length} migration files.`);

    for (const file of files) {
      console.log(`Applying migration: ${file}...`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      try {
        await client.query(sql);
        console.log(`Success: ${file}`);
      } catch (err) {
        console.error(`Error in ${file}:`, err.message);
        // Continue if it's just an "already exists" error, but these should be handled in SQL
        throw err; 
      }
    }

    console.log('\nAll migrations applied successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();

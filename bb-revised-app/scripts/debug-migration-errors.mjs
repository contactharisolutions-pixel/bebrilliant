import pg from 'pg';

const newDbUrl = 'postgresql://postgres:Life@20242526@db.zgcmncootfkygzeebnhv.supabase.co:5432/postgres';
const client = new pg.Client({ connectionString: newDbUrl });

async function run() {
  try {
    await client.connect();
    const res = await client.query(`
      SELECT column_name, is_updatable, is_generated, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'auth' AND table_name = 'users'
    `);
    console.table(res.rows);

    const constraintRes = await client.query(`
      SELECT conname, pg_get_constraintdef(oid) 
      FROM pg_constraint 
      WHERE conrelid = 'public.syllabus_nodes'::regclass
    `);
    console.log('\nSyllabus Nodes Constraints:');
    console.table(constraintRes.rows);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();

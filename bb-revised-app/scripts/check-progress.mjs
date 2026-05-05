import pg from 'pg';

const newDbUrl = 'postgresql://postgres:Life@20242526@db.zgcmncootfkygzeebnhv.supabase.co:5432/postgres';
const client = new pg.Client({ connectionString: newDbUrl });

const tables = [
  'tenants',
  'auth.users',
  'user_profiles',
  'syllabus_nodes',
  'questions',
  'exams',
  'online_exams',
  'payments',
  'leads'
];

async function run() {
  try {
    await client.connect();
    for (const table of tables) {
      const [schema, name] = table.includes('.') ? table.split('.') : ['public', table];
      const res = await client.query(`SELECT COUNT(*) FROM ${schema}.${name}`);
      console.log(`${table}: ${res.rows[0].count} rows`);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();

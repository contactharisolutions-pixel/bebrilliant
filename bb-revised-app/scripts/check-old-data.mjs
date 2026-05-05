import pg from 'pg';

const oldDbUrl = 'postgresql://postgres:Life@20242526@db.bfzlkdurgggzytegvvrw.supabase.co:5432/postgres';
const client = new pg.Client({ connectionString: oldDbUrl });

async function run() {
  try {
    await client.connect();
    const res = await client.query(`SELECT DISTINCT type FROM public.syllabus_nodes`);
    console.log('Types in old DB syllabus_nodes:');
    console.table(res.rows);

    const res2 = await client.query(`SELECT COUNT(*) FROM public.syllabus_nodes WHERE tenant_id IS NOT NULL`);
    console.log('Nodes with tenant_id:', res2.rows[0].count);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();

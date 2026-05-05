import pg from 'pg';

const oldDbUrl = 'postgresql://postgres:Life@20242526@db.bfzlkdurgggzytegvvrw.supabase.co:5432/postgres';
const client = new pg.Client({ connectionString: oldDbUrl });

async function run() {
  try {
    await client.connect();
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'exams'
    `);
    console.log('Columns in exams table:');
    res.rows.forEach(row => console.log(`- ${row.column_name} (${row.data_type})`));

    const res2 = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name LIKE '%online%'
    `);
    console.log('\nTables matching %online%:');
    res2.rows.forEach(row => console.log(`- ${row.table_name}`));

  } catch (err) {
    console.error('Error connecting to old DB:', err);
  } finally {
    await client.end();
  }
}

run();

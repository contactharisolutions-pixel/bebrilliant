import pg from 'pg';

const oldDbUrl = 'postgresql://postgres:Life@20242526@db.bfzlkdurgggzytegvvrw.supabase.co:5432/postgres';
const client = new pg.Client({ connectionString: oldDbUrl });

async function run() {
  try {
    await client.connect();
    
    // Get columns
    const colsRes = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'online_exams'
      ORDER BY ordinal_position
    `);
    
    console.log('CREATE TABLE public.online_exams (');
    const cols = colsRes.rows.map(row => {
      let line = `  ${row.column_name} ${row.data_type.toUpperCase()}`;
      if (row.is_nullable === 'NO') line += ' NOT NULL';
      if (row.column_default) line += ` DEFAULT ${row.column_default}`;
      return line;
    });
    
    // Add PK
    cols.push('  PRIMARY KEY (id)');
    
    console.log(cols.join(',\n'));
    console.log(');');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();

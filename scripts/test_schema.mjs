import pg from 'pg';
const { Client } = pg;
const client = new Client({ connectionString: 'postgresql://postgres:Life@20242526@db.bfzlkdurgggzytegvvrw.supabase.co:5432/postgres' });
await client.connect();
const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'tenants'");
console.log(res.rows);
await client.end();

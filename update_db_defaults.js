require('dotenv').config({ path: '.env.development' });
const { Client } = require('pg');

async function updateDefaults() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        const dbName = 'postgres'; 
        
        try {
            console.log('Setting Timezone to Indian Standard Time (Asia/Kolkata)...');
            await client.query(`ALTER DATABASE "${dbName}" SET timezone TO 'Asia/Kolkata';`);
            console.log('Timezone updated successfully.');
        } catch(e) { console.error('Timezone error:', e.message); }
        
        try {
            console.log('Setting Date format to DD/MM/YYYY (ISO, DMY)...');
            await client.query(`ALTER DATABASE "${dbName}" SET datestyle TO 'ISO, DMY';`);
            console.log('Datestyle updated successfully.');
        } catch(e) { console.error('Datestyle error:', e.message); }
        
        try {
            console.log('Setting Currency Locale to Indian Rupees (en_IN.UTF-8)...');
            await client.query(`ALTER DATABASE "${dbName}" SET lc_monetary TO 'en_IN.UTF-8';`);
            console.log('Currency Locale updated successfully.');
        } catch(e) { console.error('Currency error (Locale might not exist on Supabase instance):', e.message); }

    } catch (err) {
        console.error('Connection failed:', err);
    } finally {
        await client.end();
        console.log('Database connection closed.');
    }
}

updateDefaults();

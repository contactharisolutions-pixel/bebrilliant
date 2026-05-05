const { Client } = require('pg');
const path = require('path');
const fs = require('fs');

const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');

// Simple parse of .env
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...rest] = line.split('=');
    if (key && rest.length) {
        env[key.trim()] = rest.join('=').trim();
    }
});

const connectionString = env.DATABASE_URL;
if (!connectionString) throw new Error("Missing DATABASE_URL in .env");

async function run() {
    console.log("Connecting directly to PostgreSQL...");
    const client = new Client({ connectionString });

    try {
        await client.connect();
        console.log("Connected. Executing ALTER TABLE...");

        await client.query("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;");
        console.log("DDL Done: metadata column added to user_profiles.");

        const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'metadata';");
        if (res.rowCount && res.rowCount > 0) {
            console.log("Verification Success: column exists.");
        } else {
            console.log("Error: column does not exist after execution.");
        }

    } catch (err) {
        console.error("PostgreSQL Error:", err.message);
    } finally {
        await client.end();
    }
}

run();

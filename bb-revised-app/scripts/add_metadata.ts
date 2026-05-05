// @ts-ignore
import { Client } from 'pg'
import * as path from 'path'
// @ts-ignore
import * as dotenv from 'dotenv'

dotenv.config({ path: path.join(__dirname, '../.env') })

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error("Missing DATABASE_URL in .env")

async function run() {
    console.log("Connecting to PostgreSQL to add metadata column...")
    const client = new Client({ connectionString })

    try {
        await client.connect()
        console.log("Connected. Executing ALTER TABLE...")

        await client.query("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;")
        console.log("DDL executed: metadata column added to user_profiles.")

        // Let's also verify it's there
        const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'metadata';")
        if (res.rowCount && res.rowCount > 0) {
            console.log("Verification Success: metadata column found.")
        } else {
            console.log("Verification Failed: metadata column not found after execution.")
        }

    } catch (err: any) {
        console.error("Migration Error:", err.message)
    } finally {
        await client.end()
    }
}

run()

'use strict';
/**
 * download-storage-files.js — Supabase Storage Migration Downloader
 * 
 * Strategy: Connect to Supabase Cloud Postgres database, query the storage.objects table
 * to discover all file references, then download them via public URLs to prepare for VPS transfer.
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: '.env.production' });

const TARGET_DIR = path.join(__dirname, '..', 'migration_storage');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mtoslybnnywmsmpwjphv.supabase.co';
const DB_URL = process.env.DATABASE_URL;

async function downloadFile(url, destPath) {
    const dir = path.dirname(destPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to download ${url}: status ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(destPath, buffer);
    console.log(`✓ Downloaded: ${url} -> ${path.relative(TARGET_DIR, destPath)}`);
}

async function start() {
    if (!DB_URL) {
        console.error('ERROR: DATABASE_URL environment variable is missing in .env.production');
        process.exit(1);
    }

    console.log('Connecting to Supabase Cloud database to read storage files registry...');
    const client = new Client({
        connectionString: DB_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        
        // Query storage registry
        const query = 'SELECT bucket_id, name FROM storage.objects';
        const res = await client.query(query);
        const files = res.rows;

        console.log(`Found ${files.length} active files registered in cloud storage.`);

        if (files.length === 0) {
            console.log('No files to download.');
            return;
        }

        // Create base migration directory
        if (!fs.existsSync(TARGET_DIR)) {
            fs.mkdirSync(TARGET_DIR, { recursive: true });
        }

        let successCount = 0;
        let failCount = 0;

        for (const file of files) {
            const { bucket_id, name } = file;
            // Public URL pattern: https://[project-id].supabase.co/storage/v1/object/public/[bucket]/[name]
            const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket_id}/${name}`;
            const destPath = path.join(TARGET_DIR, bucket_id, name);

            try {
                await downloadFile(publicUrl, destPath);
                successCount++;
            } catch (err) {
                console.error(`✗ Failed to download ${name} from bucket ${bucket_id}:`, err.message);
                failCount++;
            }
        }

        console.log('\n====================================================');
        console.log('             Storage Downloader Summary             ');
        console.log('====================================================');
        console.log(`Total Downloaded successfully: ${successCount}`);
        console.log(`Failed downloads:               ${failCount}`);
        console.log(`Files located in:              ${path.resolve(TARGET_DIR)}`);
        console.log('\nTo deploy these on your Hostinger VPS:');
        console.log('1. Zip the migration_storage folder.');
        console.log('2. Transfer the zip to your VPS.');
        console.log('3. Extract contents into your self-hosted Supabase Docker storage volume folder:');
        console.log('   /opt/supabase/docker/volumes/storage/bucket/ (maps to docker volume).');
        console.log('====================================================');

    } catch (err) {
        console.error('Critical Database connection error:', err);
    } finally {
        await client.end();
    }
}

start();

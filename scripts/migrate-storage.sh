#!/usr/bin/env bash

# migrate-storage.sh — Storage Migration Script
# Author: Antigravity

set -e

LOCAL_STORAGE_DIR="migration_storage"
ZIP_FILE="bebrilliant_storage_migration.zip"

echo "===================================================="
echo "       BeBrilliant Storage Migration Utility        "
echo "===================================================="

# Step 1: Compress storage locally
if [ ! -d "${LOCAL_STORAGE_DIR}" ]; then
    echo "ERROR: Storage directory '${LOCAL_STORAGE_DIR}' does not exist!"
    echo "Please run 'node scripts/download-storage-files.js' first to download your files."
    exit 1
fi

echo "--> 1. Compressing downloaded storage files..."
zip -r "${ZIP_FILE}" "${LOCAL_STORAGE_DIR}"
echo "✓ Created compressed archive: ${ZIP_FILE}"

# Instructions for deployment
echo ""
echo "--> 2. VPS Deployment Instructions:"
echo "----------------------------------------------------"
echo "To transfer and extract these files into your self-hosted Supabase instance on the Hostinger VPS:"
echo ""
echo "Step A: Copy the ZIP file to your Hostinger VPS:"
echo "   scp ${ZIP_FILE} root@your-vps-ip:/tmp/"
echo ""
echo "Step B: SSH into your VPS and run the following:"
echo "   # 1. Ensure unzip is installed"
echo "   apt-get install -y unzip"
echo ""
echo "   # 2. Extract files into temporary directory"
echo "   unzip /tmp/${ZIP_FILE} -d /tmp/"
echo ""
echo "   # 3. Locate the Supabase docker storage volumes path (default is /opt/supabase/docker/volumes/storage)"
echo "   # Copy extracted buckets into the volume"
echo "   cp -r /tmp/migration_storage/* /opt/supabase/docker/volumes/storage/"
echo ""
echo "   # 4. Set appropriate permissions for Docker"
echo "   chown -R 1000:1000 /opt/supabase/docker/volumes/storage/"
echo "----------------------------------------------------"
echo "✓ Shell instruction template complete."

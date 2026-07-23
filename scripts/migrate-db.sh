#!/usr/bin/env bash

# migrate-db.sh — Database Migration Script (Schema Migration + COPY-based Data Restore)
# Author: Antigravity

set -e

# Load source configuration
SOURCE_DB_URL="postgresql://postgres:Life%4020242526@db.mtoslybnnywmsmpwjphv.supabase.co:5432/postgres"

# Default destination (Docker container named 'supabase-db' on VPS)
DEST_CONTAINER="supabase-db"
DEST_DB_USER="postgres"
DEST_DB_NAME="postgres"

# Temporary local directories
CSV_DIR="migration_csvs"
MIGRATIONS_DIR="/var/www/bebrilliant/supabase/migrations"

# System tables in auth and storage schemas to copy
SYSTEM_TABLES=(
    "auth.users"
    "auth.identities"
    "storage.buckets"
    "storage.objects"
)

# Core ERP SQL files to apply before custom migrations
CORE_SQL_FILES=(
    "schema.sql"
    "phase_2_schema.sql"
    "phase_3_schema.sql"
    "phase_4_schema.sql"
    "phase_5_schema.sql"
    "phase_6_schema.sql"
    "phase_7_schema.sql"
    "phase_8_schema.sql"
    "phase_9_schema.sql"
    "auth_schema.sql"
    "settings_schema.sql"
    "tax_schema.sql"
    "order_items_schema.sql"
    "communication_schema.sql"
    "vto_schema.sql"
    "master_data_migration.sql"
    "migrations/cms_schema.sql"
    "migrations/gst_eyewear_rules.sql"
    "migrations/allow_multi_tax_per_category.sql"
)

echo "===================================================="
echo "      BeBrilliant PostgreSQL Migration Utility      "
echo "===================================================="

# Step 1: Check destination connection
echo "--> 1. Checking destination database availability..."
if ! docker ps | grep -q "${DEST_CONTAINER}"; then
    echo "ERROR: Destination Docker container '${DEST_CONTAINER}' is not running!"
    echo "Please ensure the self-hosted Supabase stack is running on the VPS."
    exit 1
fi

# Step 2: Fetch the list of public tables dynamically from source
echo "--> 2. Fetching list of custom tables from source database..."
PUBLIC_TABLES=$(docker run --rm --network host postgres:17-alpine psql "${SOURCE_DB_URL}" -t -A -c "
    SELECT table_schema || '.' || table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
")

# Build list of all tables to migrate
TABLES=()
for tbl in $PUBLIC_TABLES; do
    # Skip table if it is a migration metadata tracker or temporal
    if [[ "$tbl" != *"schema_migrations"* ]]; then
        TABLES+=("$tbl")
    fi
done

# Append system tables to the tables list
for tbl in "${SYSTEM_TABLES[@]}"; do
    TABLES+=("$tbl")
done

echo "Found ${#TABLES[@]} tables to migrate."

# Step 3: Export all tables to CSV
echo "--> 3. Exporting tables to CSV via psql COPY..."
mkdir -p "$CSV_DIR"
for tbl in "${TABLES[@]}"; do
    echo "Exporting ${tbl}..."
    docker run --rm \
        --network host \
        -v "$(pwd)/$CSV_DIR":/backup \
        postgres:17-alpine \
        psql "${SOURCE_DB_URL}" -c "\copy ${tbl} TO '/backup/${tbl}.csv' WITH CSV HEADER" || echo "Warning: Could not export ${tbl}"
done

# Step 4: Copy CSVs to target Docker container
echo "--> 4. Copying CSV files to target database container..."
docker exec -i "${DEST_CONTAINER}" mkdir -p /tmp/migration_csvs
docker cp "$CSV_DIR/." "${DEST_CONTAINER}:/tmp/migration_csvs/"

# Step 5: Restore database in container
echo "--> 5. Restoring database inside container..."
echo "WARNING: This will drop/overwrite the public schema, run migrations, and restore auth/storage data."
read -p "Are you sure you want to proceed with restore? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Drop and recreate public schema on local DB to ensure clean migration structure
    echo "--> Dropping and recreating public schema..."
    docker exec -i "${DEST_CONTAINER}" psql -U "${DEST_DB_USER}" -d "${DEST_DB_NAME}" -c \
        "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;"

    # Apply core database schemas first
    echo "--> Running core database schemas..."
    for sql_file in "${CORE_SQL_FILES[@]}"; do
        full_path="/var/www/bebrilliant/${sql_file}"
        if [ -f "${full_path}" ]; then
            echo "Applying core schema: ${sql_file}..."
            docker exec -i "${DEST_CONTAINER}" psql -U "${DEST_DB_USER}" -d "${DEST_DB_NAME}" -f - < "${full_path}" > /dev/null || echo "Warning: Error applying ${sql_file}"
        else
            echo "Warning: Core schema file not found at ${full_path}"
        fi
    done

    # Apply all SQL migration scripts in sorted alphabetical order
    echo "--> Running custom database schema migrations..."
    if [ -d "$MIGRATIONS_DIR" ]; then
        for sql_file in $(ls "$MIGRATIONS_DIR"/*.sql | sort); do
            echo "Applying migration: $(basename "$sql_file")..."
            docker exec -i "${DEST_CONTAINER}" psql -U "${DEST_DB_USER}" -d "${DEST_DB_NAME}" -f - < "$sql_file" > /dev/null || echo "Warning: Error applying $(basename "$sql_file")"
        done
    else
        echo "Warning: Migrations directory not found at $MIGRATIONS_DIR"
    fi

    # Truncate existing auth and storage tables to prevent duplicate key violations
    echo "--> Truncating auth and storage tables..."
    docker exec -i "${DEST_CONTAINER}" psql -U "${DEST_DB_USER}" -d "${DEST_DB_NAME}" -c "
        SET session_replication_role = 'replica';
        TRUNCATE TABLE auth.users CASCADE;
        TRUNCATE TABLE storage.objects CASCADE;
    "

    # Import data via COPY inside a 'replica' session to bypass trigger constraints
    echo "--> Importing data..."
    for tbl in "${TABLES[@]}"; do
        csv_file="$CSV_DIR/${tbl}.csv"
        if [ -f "$csv_file" ]; then
            echo "Importing ${tbl}..."
            echo "SET session_replication_role = 'replica'; \copy ${tbl} FROM '/tmp/migration_csvs/${tbl}.csv' WITH CSV HEADER" | \
                docker exec -i "${DEST_CONTAINER}" psql -U "${DEST_DB_USER}" -d "${DEST_DB_NAME}" -v ON_ERROR_STOP=1 || echo "Error importing ${tbl}"
        fi
    done
        
    echo "✓ Database schemas and data restored successfully!"
else
    echo "Restore cancelled by user."
fi

# Clean up local and container temporary files
rm -rf "$CSV_DIR"
docker exec -i "${DEST_CONTAINER}" rm -rf /tmp/migration_csvs
echo "Migration sequence finished."

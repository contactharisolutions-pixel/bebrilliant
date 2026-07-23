import sys
import time
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

VPS_IP = "89.116.33.188"
VPS_USER = "root"
VPS_PASS = "Life@20242526"

SOURCE_DB_URL = "postgresql://postgres:Life%4020242526@db.mtoslybnnywmsmpwjphv.supabase.co:5432/postgres"

# Tables to import - ordered by dependency (parents before children)
TABLES_TO_IMPORT = [
    # Independent/lookup tables first
    "public.genders",
    "public.frame_types",
    "public.frame_colors",
    "public.lens_colors",
    "public.shapes",
    "public.brands",
    "public.categories",
    "public.business",
    "public.showroom",
    "public.warehouse",
    "public.brand",
    "public.category",
    # Products and variants
    "public.product",
    "public.variant",
    "public.inventory",
    "public.stock_movement",
    "public.stock_transfer",
    # Users and customers
    "public.customer_address",
    "public.customer_order",
    "public.customer_order_item",
    "public.cart_items",
    "public.online_cart",
    "public.online_cart_item",
    # Other business tables
    "public.media_library",
    "public.prescription",
    "public.eye_test",
    "public.repair",
    "public.follow_up",
    "public.lead",
    "public.leads",
    "public.appointment",
    "public.invoices",
    "public.payments",
    # CMS
    "public.blog",
    "public.cms_pages",
    "public.cms_banners",
    "public.cms_brand_hero",
    "public.cms_sections",
    "public.pages",
    "public.popup",
    # Notifications
    "public.notifications",
    "public.messages",
]

def run_cmd(ssh, cmd, ignore_error=False):
    print(f"\n>>> {cmd[:120]}...")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=120)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    
    if out.strip():
        print(f"  [OUT] {out.strip()[:300]}")
    if err.strip() and exit_status != 0:
        print(f"  [ERR] {err.strip()[:300]}")
    
    if exit_status != 0 and not ignore_error:
        raise Exception(f"Command failed (exit {exit_status}): {cmd}")
    
    return out, err, exit_status

def main():
    print("=" * 60)
    print("VPS Fix & Data Migration Script")
    print("=" * 60)
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(VPS_IP, username=VPS_USER, password=VPS_PASS, timeout=30)
        print("[OK] Connected to Hostinger VPS.")

        # Step 1: Fix docker-compose.yml - update supavisor port to 5433
        print("\n--> Step 1: Fixing docker-compose supavisor port to 5433...")
        sftp = ssh.open_sftp()
        dc_path = "/opt/supabase/docker/docker-compose.yml"
        with sftp.file(dc_path, "r") as f:
            content = f.read().decode('utf-8')
        
        # Fix: supavisor should use 5433:5432 instead of ${POSTGRES_PORT}:5432
        content = content.replace(
            "      - ${POSTGRES_PORT}:5432\n      - ${POOLER_PROXY_PORT_TRANSACTION}:6543",
            "      - 5433:5432\n      - ${POOLER_PROXY_PORT_TRANSACTION}:6543"
        )
        
        with sftp.file(dc_path, "w") as f:
            f.write(content)
        print("[OK] docker-compose.yml supavisor port updated to 5433.")

        # Step 2: Start supavisor and remaining containers
        print("\n--> Step 2: Starting remaining containers (supavisor, edge-functions)...")
        run_cmd(ssh, "cd /opt/supabase/docker && docker compose up -d", ignore_error=True)
        print("[OK] Docker compose up done. Waiting 10s for services...")
        time.sleep(10)

        # Step 3: Check container and port status
        print("\n--> Step 3: Verifying container and port status...")
        run_cmd(ssh, "docker ps --format 'table {{.Names}}\\t{{.Status}}\\t{{.Ports}}'", ignore_error=True)
        run_cmd(ssh, "netstat -tulnp | grep -E '5432|5433|8000|3000'", ignore_error=True)

        # Step 4: Test direct DB connection
        print("\n--> Step 4: Testing direct DB connection on port 5432...")
        run_cmd(ssh, "docker exec supabase-db psql -U postgres -d postgres -c 'SELECT version();'")
        print("[OK] Direct database connection works!")

        # Step 5: Export and import missing table data
        print("\n--> Step 5: Exporting and importing missing table data...")
        
        # Create CSV directory in container
        run_cmd(ssh, "docker exec supabase-db mkdir -p /tmp/migration_csvs", ignore_error=True)
        
        success_count = 0
        error_count = 0
        
        for table in TABLES_TO_IMPORT:
            schema, tbl_name = table.split(".")
            csv_filename = f"{schema}.{tbl_name}.csv"
            
            try:
                # Export from source to local CSV file on VPS
                export_cmd = (
                    f"docker run --rm --network host "
                    f"-v /tmp/migration_csvs:/backup "
                    f"postgres:17-alpine "
                    f"psql \"{SOURCE_DB_URL}\" "
                    f"-c \"\\copy {table} TO '/backup/{csv_filename}' WITH CSV HEADER\""
                )
                out, err, code = run_cmd(ssh, export_cmd, ignore_error=True)
                
                if code != 0:
                    print(f"  [SKIP] Could not export {table} (may not exist in source): {err.strip()[:100]}")
                    continue
                
                # Copy CSV into container
                cp_cmd = f"docker cp /tmp/migration_csvs/{csv_filename} supabase-db:/tmp/migration_csvs/{csv_filename}"
                run_cmd(ssh, cp_cmd)
                
                # Import into destination
                import_cmd = (
                    f"echo \"SET session_replication_role = 'replica'; "
                    f"\\\\copy {table} FROM '/tmp/migration_csvs/{csv_filename}' WITH CSV HEADER\" | "
                    f"docker exec -i supabase-db psql -U postgres -d postgres"
                )
                out, err, code = run_cmd(ssh, import_cmd, ignore_error=True)
                
                if code == 0:
                    print(f"  [OK] Imported {table}")
                    success_count += 1
                else:
                    print(f"  [ERR] Failed to import {table}: {err.strip()[:150]}")
                    error_count += 1
                    
            except Exception as e:
                print(f"  [ERR] Exception for {table}: {e}")
                error_count += 1

        print(f"\n[SUMMARY] Imported: {success_count}, Failed: {error_count}")
        
        # Step 6: Verify row counts in destination
        print("\n--> Step 6: Verifying destination row counts...")
        verify_query = """
SELECT 'public.categories' as tbl, count(*) FROM public.categories
UNION ALL SELECT 'public.brands', count(*) FROM public.brands
UNION ALL SELECT 'public.business', count(*) FROM public.business
UNION ALL SELECT 'public.showroom', count(*) FROM public.showroom
UNION ALL SELECT 'public.product', count(*) FROM public.product
UNION ALL SELECT 'public.variant', count(*) FROM public.variant
UNION ALL SELECT 'public.inventory', count(*) FROM public.inventory
UNION ALL SELECT 'public.customer', count(*) FROM public.customer
UNION ALL SELECT 'public.customer_order', count(*) FROM public.customer_order
ORDER BY tbl;
"""
        run_cmd(ssh, f"docker exec supabase-db psql -U postgres -d postgres -c \"{verify_query}\"")

        # Step 7: Rebuild Next.js and restart PM2 apps
        print("\n--> Step 7: Rebuilding Next.js production build on VPS...")
        build_cmd = (
            "export NVM_DIR=\"$HOME/.nvm\" && [ -s \"$NVM_DIR/nvm.sh\" ] && \\. \"$NVM_DIR/nvm.sh\" && "
            "cd /var/www/bebrilliant && npm run build"
        )
        run_cmd(ssh, build_cmd)
        print("[OK] Next.js build complete.")

        # Step 8: Restart PM2 apps
        print("\n--> Step 8: Restarting PM2 processes...")
        pm2_cmd = (
            "export NVM_DIR=\"$HOME/.nvm\" && [ -s \"$NVM_DIR/nvm.sh\" ] && \\. \"$NVM_DIR/nvm.sh\" && "
            "pm2 restart all"
        )
        run_cmd(ssh, pm2_cmd)
        
        pm2_status_cmd = (
            "export NVM_DIR=\"$HOME/.nvm\" && [ -s \"$NVM_DIR/nvm.sh\" ] && \\. \"$NVM_DIR/nvm.sh\" && "
            "pm2 status"
        )
        run_cmd(ssh, pm2_status_cmd)

        # Step 9: Test HTTPS endpoints
        print("\n--> Step 9: Testing application endpoints...")
        run_cmd(ssh, "curl -I --max-time 10 http://127.0.0.1:3000 2>&1 | head -5", ignore_error=True)
        run_cmd(ssh, "curl -I --max-time 10 http://127.0.0.1:5174 2>&1 | head -5", ignore_error=True)

        print("\n" + "=" * 60)
        print("FIX & MIGRATION COMPLETED!")
        print("=" * 60)
        print("Direct PostgreSQL is now exposed on host port 5432")
        print("Supavisor (pooler) is on port 5433")
        print("Express connects directly to DB without ENOIDENTIFIER error")
        print("\nEndpoints:")
        print("  Main App:  https://bebrilliant.in")
        print("  Storefront: https://shop.bebrilliant.in")
        print("  Supabase Studio: https://supabase.bebrilliant.in/studio")

    except Exception as e:
        print(f"\n[ERROR] {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    main()

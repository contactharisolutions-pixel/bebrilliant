import sys
import time
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

VPS_IP = "89.116.33.188"
VPS_USER = "root"
VPS_PASS = "Life@20242526"

SOURCE_DB_URL = "postgresql://postgres:Life%4020242526@db.mtoslybnnywmsmpwjphv.supabase.co:5432/postgres"

# Tables that still have 0 rows after initial import
PROBLEM_TABLES = [
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
    "public.product",
    "public.variant",
    "public.customer_order",
    "public.customer_order_item",
    "public.stock_movement",
    "public.prescription",
    "public.eye_test",
    "public.repair",
    "public.follow_up",
    "public.lead",
]

def run_cmd(ssh, cmd, ignore_error=False, timeout=120):
    print(f"\n>>> {cmd[:150]}...")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')

    if out.strip():
        print(f"  [OUT] {out.strip()[:500]}")
    if err.strip():
        print(f"  [ERR] {err.strip()[:300]}")
    return out, err, exit_status

def main():
    print("=" * 60)
    print("VPS Deep Debug & Targeted Table Fix")
    print("=" * 60)

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        ssh.connect(VPS_IP, username=VPS_USER, password=VPS_PASS, timeout=30)
        print("[OK] Connected to Hostinger VPS.")
        sftp = ssh.open_sftp()

        # ---- Step 1: Debug source DB row counts ----
        print("\n" + "=" * 50)
        print("STEP 1: Checking source DB row counts (via psql)")
        print("=" * 50)
        source_check = """
SELECT table_name, 
       (xpath('/row/c/text()', query_to_xml(format('SELECT COUNT(*) AS c FROM %I.%I', table_schema, table_name), false, true, '')))[1]::TEXT::INT AS row_count
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;
""".replace("\n", " ")
        run_cmd(ssh, f"docker run --rm --network host postgres:17-alpine psql \"{SOURCE_DB_URL}\" -c \"{source_check}\"")

        # ---- Step 2: Try direct pg_dump approach for key tables ----
        print("\n" + "=" * 50)
        print("STEP 2: Export using pg_dump (binary) - bypasses RLS")
        print("=" * 50)
        
        # pg_dump only data for key tables
        key_tables_args = (
            "-t public.categories -t public.brands -t public.brand "
            "-t public.business -t public.showroom -t public.product "
            "-t public.variant -t public.genders -t public.frame_types "
            "-t public.frame_colors -t public.lens_colors -t public.shapes "
            "-t public.warehouse -t public.category -t public.customer_order "
            "-t public.customer_order_item -t public.stock_movement "
            "-t public.prescription -t public.eye_test -t public.repair "
            "-t public.follow_up -t public.lead"
        )
        
        dump_cmd = (
            f"docker run --rm --network host "
            f"-v /tmp/migration_csvs:/backup "
            f"postgres:17-alpine "
            f"pg_dump \"{SOURCE_DB_URL}\" "
            f"--data-only --no-privileges --no-owner "
            f"{key_tables_args} "
            f"-f /backup/key_tables_dump.sql"
        )
        out, err, code = run_cmd(ssh, dump_cmd, ignore_error=True, timeout=180)
        
        if code == 0:
            print("[OK] pg_dump succeeded. Checking dump file size...")
            run_cmd(ssh, "ls -lh /tmp/migration_csvs/key_tables_dump.sql")
            run_cmd(ssh, "head -50 /tmp/migration_csvs/key_tables_dump.sql")
            
            # Copy the dump file into the DB container
            print("\n--> Copying dump into supabase-db container...")
            run_cmd(ssh, "docker cp /tmp/migration_csvs/key_tables_dump.sql supabase-db:/tmp/key_tables_dump.sql")
            
            # Apply the dump
            print("--> Applying dump to destination DB...")
            apply_cmd = (
                "docker exec supabase-db psql -U postgres -d postgres "
                "-c \"SET session_replication_role = 'replica';\" "
                "-f /tmp/key_tables_dump.sql"
            )
            out, err, code = run_cmd(ssh, apply_cmd, ignore_error=True, timeout=120)
            print(f"[{'OK' if code == 0 else 'ERR'}] Dump applied (exit {code})")
        else:
            print(f"[WARN] pg_dump failed, trying alternate approach...")
            
            # Alternate: use COPY TO STDOUT and pipe directly into destination
            print("\n--> Trying direct pipe approach for each table...")
            for table in PROBLEM_TABLES:
                # Export from source via stdout and pipe directly into destination via stdin
                pipe_cmd = (
                    f"docker run --rm --network host postgres:17-alpine "
                    f"psql \"{SOURCE_DB_URL}\" "
                    f"-c \"COPY {table} TO STDOUT WITH CSV HEADER\" | "
                    f"docker exec -i supabase-db "
                    f"psql -U postgres -d postgres "
                    f"-c \"SET session_replication_role = 'replica';\" "
                    f"-c \"COPY {table} FROM STDIN WITH CSV HEADER\""
                )
                out, err, pcode = run_cmd(ssh, pipe_cmd, ignore_error=True, timeout=60)
                print(f"  [{table}] exit={pcode}")

        # ---- Step 3: Verify final row counts ----
        print("\n" + "=" * 50)
        print("STEP 3: Verifying destination row counts after fix")
        print("=" * 50)
        verify_query = (
            "SELECT 'categories' as tbl, count(*) FROM public.categories "
            "UNION ALL SELECT 'brands', count(*) FROM public.brands "
            "UNION ALL SELECT 'business', count(*) FROM public.business "
            "UNION ALL SELECT 'showroom', count(*) FROM public.showroom "
            "UNION ALL SELECT 'product', count(*) FROM public.product "
            "UNION ALL SELECT 'variant', count(*) FROM public.variant "
            "UNION ALL SELECT 'inventory', count(*) FROM public.inventory "
            "UNION ALL SELECT 'customer', count(*) FROM public.customer "
            "UNION ALL SELECT 'customer_order', count(*) FROM public.customer_order "
            "UNION ALL SELECT 'genders', count(*) FROM public.genders "
            "UNION ALL SELECT 'frame_types', count(*) FROM public.frame_types "
            "ORDER BY tbl;"
        )
        run_cmd(ssh, f"docker exec supabase-db psql -U postgres -d postgres -c \"{verify_query}\"")

        # ---- Step 4: Check PM2 logs for errors ----
        print("\n" + "=" * 50)
        print("STEP 4: Checking PM2 logs for errors")
        print("=" * 50)
        run_cmd(ssh, "tail -n 30 /root/.pm2/logs/bebrilliant-express-error-1.log 2>/dev/null", ignore_error=True)
        run_cmd(ssh, "tail -n 20 /root/.pm2/logs/bebrilliant-next-error-0.log 2>/dev/null", ignore_error=True)

        # ---- Step 5: Check if apps are actually running & responding ----
        print("\n" + "=" * 50)
        print("STEP 5: Testing app endpoints")
        print("=" * 50)
        run_cmd(ssh, (
            "export NVM_DIR=\"$HOME/.nvm\" && [ -s \"$NVM_DIR/nvm.sh\" ] && \\. \"$NVM_DIR/nvm.sh\" && "
            "pm2 status"
        ), ignore_error=True)
        
        # Simple response test without head limiting
        run_cmd(ssh, "curl -s -o /dev/null -w '%{http_code}' --max-time 15 http://127.0.0.1:3000", ignore_error=True)
        run_cmd(ssh, "curl -s -o /dev/null -w '%{http_code}' --max-time 15 http://127.0.0.1:5174", ignore_error=True)
        run_cmd(ssh, "curl -s -o /dev/null -w '%{http_code}' --max-time 15 https://bebrilliant.in", ignore_error=True)

        # ---- Step 6: Check DATABASE_URL in app env ----
        print("\n" + "=" * 50)
        print("STEP 6: Checking .env.production on VPS")
        print("=" * 50)
        run_cmd(ssh, "cat /var/www/bebrilliant/.env.production | grep -E 'DATABASE_URL|SUPABASE_URL|PORT'", ignore_error=True)

        # ---- Step 7: Check db.js connection logic ----
        print("\n" + "=" * 50)
        print("STEP 7: Check db.js for SSL/port configuration")
        print("=" * 50)
        run_cmd(ssh, "head -60 /var/www/bebrilliant/db.js", ignore_error=True)

    except Exception as e:
        print(f"\n[ERROR] {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    main()

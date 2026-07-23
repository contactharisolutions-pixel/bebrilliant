import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

VPS_IP = "89.116.33.188"
VPS_USER = "root"
VPS_PASS = "Life@20242526"

def run(ssh, cmd, ignore_error=True):
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=60)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    return out, err, exit_status

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(VPS_IP, username=VPS_USER, password=VPS_PASS, timeout=30)

        with open("vps_db_audit.log", "w", encoding="utf-8") as f:
            def log(msg):
                print(msg)
                f.write(msg + "\n")

            log("=" * 60)
            log("BeBrilliant VPS Database Audit")
            log("=" * 60)

            # 1. Row counts for ALL public tables
            log("\n--- PUBLIC SCHEMA TABLE ROW COUNTS ---")
            q = """
SELECT table_name,
  (xpath('/row/c/text()',
    query_to_xml(format('SELECT COUNT(*) AS c FROM public.%I', table_name), false, true, ''))
  )[1]::text::int AS row_count
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY row_count DESC, table_name;
"""
            out, err, code = run(ssh, f"docker exec supabase-db psql -U postgres -d postgres -t -A -c \"{q.strip()}\"")
            log(out if out else f"ERROR: {err}")

            # 2. Auth users count
            log("\n--- AUTH USERS ---")
            out, err, _ = run(ssh, "docker exec supabase-db psql -U postgres -d postgres -c \"SELECT count(*) as total_auth_users FROM auth.users;\"")
            log(out)

            # 3. Storage objects & buckets
            log("\n--- STORAGE BUCKETS & OBJECTS ---")
            out, err, _ = run(ssh, """docker exec supabase-db psql -U postgres -d postgres -c "
SELECT 'buckets' as type, count(*) FROM storage.buckets
UNION ALL
SELECT 'objects', count(*) FROM storage.objects;" """)
            log(out)

            # 4. Key business tables detail
            log("\n--- KEY BUSINESS DATA DETAIL ---")
            detail_q = """
SELECT 'business' as tbl, business_name as detail FROM public.business LIMIT 3
UNION ALL
SELECT 'showroom', showroom_name FROM public.showroom LIMIT 3
UNION ALL
SELECT 'app_user', COALESCE(name, email) FROM public.app_user LIMIT 5
UNION ALL
SELECT 'customer', COALESCE(name, email) FROM public.customer LIMIT 5;
"""
            out, err, _ = run(ssh, f"docker exec supabase-db psql -U postgres -d postgres -c \"{detail_q.strip()}\"")
            log(out)

            # 5. Tables with 0 rows (empty — possible missing migration)
            log("\n--- EMPTY TABLES (0 rows — may need data) ---")
            empty_q = """
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  AND (xpath('/row/c/text()',
    query_to_xml(format('SELECT COUNT(*) AS c FROM public.%I', table_name), false, true, ''))
  )[1]::text::int = 0
ORDER BY table_name;
"""
            out, err, code = run(ssh, f"docker exec supabase-db psql -U postgres -d postgres -t -A -c \"{empty_q.strip()}\"")
            log(out if out else f"ERROR: {err}")

            # 6. PM2 app status
            log("\n--- PM2 APP STATUS ---")
            out, err, _ = run(ssh, "export NVM_DIR=\"$HOME/.nvm\" && [ -s \"$NVM_DIR/nvm.sh\" ] && \\. \"$NVM_DIR/nvm.sh\" && pm2 status")
            log(out)

            # 7. Recent Express app errors (last 20 lines)
            log("\n--- EXPRESS RECENT ERRORS ---")
            out, err, _ = run(ssh, "tail -n 20 /root/.pm2/logs/bebrilliant-express-error-1.log 2>/dev/null")
            log(out if out else "(no errors)")

            # 8. Next.js recent errors
            log("\n--- NEXT.JS RECENT ERRORS ---")
            out, err, _ = run(ssh, "tail -n 20 /root/.pm2/logs/bebrilliant-next-error-0.log 2>/dev/null")
            log(out if out else "(no errors)")

            # 9. HTTP endpoint check
            log("\n--- HTTP ENDPOINT CHECK ---")
            for url in ["http://127.0.0.1:3000", "http://127.0.0.1:5174", "https://bebrilliant.in"]:
                out, err, code = run(ssh, f"curl -s -o /dev/null -w '%{{http_code}}' --max-time 10 '{url}'")
                log(f"  {url}: HTTP {out.strip() or 'TIMEOUT'}")

            # 10. Disk usage
            log("\n--- DISK USAGE ---")
            out, err, _ = run(ssh, "df -h / | tail -1")
            log(out)
            out, err, _ = run(ssh, "du -sh /opt/supabase/docker/volumes/db/data/ 2>/dev/null")
            log(f"  Postgres data dir: {out.strip()}")

            log("\n" + "=" * 60)
            log("AUDIT COMPLETE")
            log("=" * 60)

    except Exception as e:
        print(f"Error: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    main()

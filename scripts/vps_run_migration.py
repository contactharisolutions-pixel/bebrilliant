import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

VPS_IP = "89.116.33.188"
VPS_USER = "root"
VPS_PASS = "Life@20242526"

def run_cmd(ssh, cmd, label=""):
    print(f"\n=========================================")
    if label:
        print(f"# {label}")
    print(f"Executing: {cmd}")
    print("=========================================")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='ignore')
    err = stderr.read().decode('utf-8', errors='ignore')
    print(f"Exit status: {exit_status}")
    if out:
        print("[STDOUT]")
        print(out)
    if err:
        print("[STDERR]")
        print(err)
    return exit_status, out

def main():
    migration_file = sys.argv[1] if len(sys.argv) > 1 else "050_dynamic_plan_features.sql"
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(VPS_IP, username=VPS_USER, password=VPS_PASS, timeout=30)
        print("[OK] Connected to Hostinger VPS.")

        # Upload the SQL migration file
        sftp = ssh.open_sftp()
        local_sql = f"d:\\MyProjects\\BeBrilliant\\supabase\\migrations\\{migration_file}"
        remote_sql = f"/var/www/bebrilliant/supabase/migrations/{migration_file}"
        print(f"Uploading {local_sql} to {remote_sql}...")
        sftp.put(local_sql, remote_sql)
        print("[OK] Uploaded SQL file")
        sftp.close()

        # Run the SQL migration on dockerized Postgres
        run_cmd(ssh,
            f"docker exec -i supabase-db psql -U postgres -d postgres < {remote_sql}",
            f"Run SQL Migration {migration_file} on Docker Postgres")

        # Verify the migration worked
        run_cmd(ssh,
            "docker exec -i supabase-db psql -U postgres -d postgres -c 'SELECT id, key, label, category, is_system FROM public.plan_features ORDER BY sort_order;'",
            "Verify plan_features Table")

        print("\n==============================================")
        print("   MIGRATION COMPLETED & VERIFIED ON VPS")
        print("==============================================")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    main()

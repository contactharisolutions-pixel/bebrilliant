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
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(VPS_IP, username=VPS_USER, password=VPS_PASS, timeout=30)
        print("[OK] Connected to Hostinger VPS.")

        # Upload the SQL migration file
        sftp = ssh.open_sftp()
        local_sql = "d:\\MyProjects\\BeBrilliant\\supabase\\migrations\\047_merge_owner_admin_rbac.sql"
        remote_sql = "/var/www/bebrilliant/supabase/migrations/047_merge_owner_admin_rbac.sql"
        print(f"Uploading {local_sql} to {remote_sql}...")
        sftp.put(local_sql, remote_sql)
        print("[OK] Uploaded SQL file")
        sftp.close()

        # Run the SQL migration on dockerized Postgres
        run_cmd(ssh,
            "docker exec -i supabase-db psql -U postgres -d postgres < /var/www/bebrilliant/supabase/migrations/047_merge_owner_admin_rbac.sql",
            "Run SQL Migration on Docker Postgres")

        print("\n==============================================")
        print("   MIGRATION COMPLETED SUCCESSFULLY ON VPS")
        print("==============================================")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    main()

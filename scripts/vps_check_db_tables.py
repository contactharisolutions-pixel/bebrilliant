import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

VPS_IP = "89.116.33.188"
VPS_USER = "root"
VPS_PASS = "Life@20242526"

def run_cmd(ssh, cmd):
    print(f"\n=========================================\nExecuting: {cmd}\n=========================================")
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

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(VPS_IP, username=VPS_USER, password=VPS_PASS, timeout=30)
        print("[OK] Connected to Hostinger VPS.")
        
        # Check tables in the newly started supabase-db container
        run_cmd(ssh, "docker exec supabase-db psql -U postgres -d postgres -c \"SELECT table_schema, count(*) FROM information_schema.tables WHERE table_schema IN ('public', 'auth', 'storage') GROUP BY table_schema;\"")
        
        # Check if user_profiles table exists
        run_cmd(ssh, "docker exec supabase-db psql -U postgres -d postgres -c \"\dt public.user_profiles\"")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    main()

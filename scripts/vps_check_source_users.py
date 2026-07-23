import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

VPS_IP = "89.116.33.188"
VPS_USER = "root"
VPS_PASS = "Life@20242526"

SOURCE_DB_URL = "postgresql://postgres:Life%4020242526@db.mtoslybnnywmsmpwjphv.supabase.co:5432/postgres"

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
        
        # 1. Query auth.users in the source database
        run_cmd(ssh, f"docker run --rm --network host postgres:17-alpine psql \"{SOURCE_DB_URL}\" -c \"SELECT id, email, role, confirmed_at FROM auth.users LIMIT 10;\"")
        
        # 2. Query public.user_profiles in the source database
        run_cmd(ssh, f"docker run --rm --network host postgres:17-alpine psql \"{SOURCE_DB_URL}\" -c \"SELECT id, email, role, is_active FROM public.user_profiles LIMIT 10;\"")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    main()

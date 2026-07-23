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
        
        hosts = [
            "db.mtoslybnnywmsmpwjphv.supabase.co",
            "db.bfzlkdurgggzytegvvrw.supabase.co",
            "db.zgcmncootfkygzeebnhv.supabase.co"
        ]
        
        for host in hosts:
            print(f"\n---> Testing host: {host}")
            run_cmd(ssh, f"getent hosts {host} || echo 'DNS lookup failed'")
            run_cmd(ssh, f"docker run --rm --network host postgres:17-alpine pg_isready -h {host} -p 5432")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    main()

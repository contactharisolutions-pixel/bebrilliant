'use strict';
# python script
import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

VPS_IP = "89.116.33.188"
VPS_USER = "root"
VPS_PASS = "Life@20242526"

def run_debug():
    print("Connecting to VPS via SSH to debug...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(VPS_IP, username=VPS_USER, password=VPS_PASS, timeout=30)
        print("[OK] Connected to Hostinger VPS.")
        
        # Test psql COPY command for public.categories via stdin pipe
        cmd = "cat /var/www/bebrilliant/src/app/owner/finance/page.tsx"
        print(f"\nExecuting: {cmd}")
        stdin, stdout, stderr = ssh.exec_command(cmd)
        
        exit_status = stdout.channel.recv_exit_status()
        print(f"Exit status: {exit_status}")
        print("[STDOUT]")
        print(stdout.read().decode('utf-8', errors='ignore'))
        print("[STDERR]")
        print(stderr.read().decode('utf-8', errors='ignore'))

        
    except Exception as e:
        print(f"[ERROR] Connection or execution failed: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    run_debug()







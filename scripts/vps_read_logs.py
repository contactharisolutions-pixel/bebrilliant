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
        
        # Check PM2 logs for bebrilliant-next
        run_cmd(ssh, "tail -n 20 /root/.pm2/logs/bebrilliant-next-out.log 2>/dev/null")
        run_cmd(ssh, "tail -n 20 /root/.pm2/logs/bebrilliant-next-error.log 2>/dev/null")
        
        # Check PM2 describe to see port and env
        run_cmd(ssh, "export NVM_DIR=\"$HOME/.nvm\" && [ -s \"$NVM_DIR/nvm.sh\" ] && \\. \"$NVM_DIR/nvm.sh\" && pm2 describe 8")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    main()

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

        # Check ALL ports Express might be on
        run_cmd(ssh, "ss -tlnp | grep node", "All node listening ports")

        # Check what the PM2 dump file has
        run_cmd(ssh, "cat /root/.pm2/dump.pm2 | grep -A5 'bebrilliant-express'", "PM2 dump file")

        # Check if PORT is correctly set in the ecosystem via env inspect
        run_cmd(ssh,
            "export NVM_DIR=\"$HOME/.nvm\" && [ -s \"$NVM_DIR/nvm.sh\" ] && \\. \"$NVM_DIR/nvm.sh\" "
            "&& pm2 env 26 2>/dev/null || pm2 env bebrilliant-express 2>/dev/null | grep -i 'PORT\\|NODE_ENV'",
            "PM2 env for bebrilliant-express")

        # Check the full PM2 describe output
        run_cmd(ssh,
            "export NVM_DIR=\"$HOME/.nvm\" && [ -s \"$NVM_DIR/nvm.sh\" ] && \\. \"$NVM_DIR/nvm.sh\" "
            "&& pm2 describe bebrilliant-express | grep -E 'port|PORT|env|pid|status' | head -20",
            "PM2 describe bebrilliant-express")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    main()

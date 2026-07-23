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
    if err and exit_status != 0:
        print("[STDERR]")
        print(err)
    return exit_status, out

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(VPS_IP, username=VPS_USER, password=VPS_PASS, timeout=30)
        print("[OK] Connected to Hostinger VPS.")

        # 1. Verify certificate is now correct
        run_cmd(ssh,
            "curl -Iv --resolve bebrilliant.in:443:127.0.0.1 https://bebrilliant.in 2>&1 | grep -i 'subject\\|subjectAltName\\|SSL' | head -10",
            "SSL Certificate Verification")

        # 2. Check HTTP response code from main domain
        run_cmd(ssh,
            "curl -o /dev/null -s -w 'HTTP Status: %{http_code}\\n' -L https://bebrilliant.in",
            "Main Domain HTTP Response")

        # 3. Check shop subdomain response
        run_cmd(ssh,
            "curl -o /dev/null -s -w 'HTTP Status: %{http_code}\\n' -L https://shop.bebrilliant.in",
            "Shop Subdomain HTTP Response")

        # 4. Confirm PM2 processes are running
        run_cmd(ssh,
            "export NVM_DIR=\"$HOME/.nvm\" && [ -s \"$NVM_DIR/nvm.sh\" ] && \\. \"$NVM_DIR/nvm.sh\" && pm2 list | grep bebrilliant",
            "PM2 Process Status")

        # 5. Check Nginx is running cleanly
        run_cmd(ssh, "nginx -t 2>&1", "Nginx Config Test")

        print("\n==============================================")
        print("   BEBRILLIANT.IN HEALTH CHECK COMPLETE")
        print("==============================================")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    main()

import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko
import os

VPS_IP = "89.116.33.188"
VPS_USER = "root"
VPS_PASS = "Life@20242526"
LOCAL_ECOSYSTEM = r"d:\MyProjects\BeBrilliant\ecosystem.config.js"
REMOTE_ECOSYSTEM = "/var/www/bebrilliant/ecosystem.config.js"

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

        # 1. Upload the updated ecosystem.config.js
        sftp = ssh.open_sftp()
        sftp.put(LOCAL_ECOSYSTEM, REMOTE_ECOSYSTEM)
        sftp.close()
        print(f"[OK] Uploaded {os.path.basename(LOCAL_ECOSYSTEM)} to VPS.")

        # 2. Delete the stale PM2 process and re-start fresh using new ecosystem
        run_cmd(ssh,
            "export NVM_DIR=\"$HOME/.nvm\" && [ -s \"$NVM_DIR/nvm.sh\" ] && \\. \"$NVM_DIR/nvm.sh\" "
            "&& cd /var/www/bebrilliant "
            "&& pm2 delete bebrilliant-express "
            "&& pm2 start ecosystem.config.js --only bebrilliant-express",
            "Delete & restart bebrilliant-express with fresh env")

        # 3. Wait and confirm port binding
        run_cmd(ssh,
            "sleep 4 && ss -tlnp | grep -E '5174|5175'",
            "Check listening port after restart")

        # 4. Check PM2 status
        run_cmd(ssh,
            "export NVM_DIR=\"$HOME/.nvm\" && [ -s \"$NVM_DIR/nvm.sh\" ] && \\. \"$NVM_DIR/nvm.sh\" "
            "&& pm2 list | grep bebrilliant",
            "PM2 bebrilliant process status")

        # 5. Test the shop subdomain
        run_cmd(ssh,
            "curl -o /dev/null -s -w 'shop.bebrilliant.in HTTP Status: %{http_code}\\n' -L https://shop.bebrilliant.in",
            "Test shop.bebrilliant.in HTTPS")

        # 6. Save the updated PM2 process list
        run_cmd(ssh,
            "export NVM_DIR=\"$HOME/.nvm\" && [ -s \"$NVM_DIR/nvm.sh\" ] && \\. \"$NVM_DIR/nvm.sh\" && pm2 save",
            "Save PM2 process list")

        print("\n==============================================")
        print("   EXPRESS PORT 5175 FIX COMPLETE")
        print("==============================================")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    main()

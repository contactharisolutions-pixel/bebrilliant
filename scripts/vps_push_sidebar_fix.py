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

        # Upload the fixed OwnerSidebar.tsx
        sftp = ssh.open_sftp()
        sftp.put(r"d:\MyProjects\BeBrilliant\src\components\owner\OwnerSidebar.tsx", "/var/www/bebrilliant/src/components/owner/OwnerSidebar.tsx")
        print("[OK] Uploaded fixed OwnerSidebar.tsx to VPS.")
        sftp.close()

        # Rebuild the Next.js app on VPS (since OwnerSidebar is a Next.js component)
        run_cmd(ssh,
            "export NVM_DIR=\"$HOME/.nvm\" && [ -s \"$NVM_DIR/nvm.sh\" ] && \\. \"$NVM_DIR/nvm.sh\" "
            "&& cd /var/www/bebrilliant && npm run build",
            "Rebuild Next.js app on VPS")

        # Restart Next.js app in PM2
        run_cmd(ssh,
            "export NVM_DIR=\"$HOME/.nvm\" && [ -s \"$NVM_DIR/nvm.sh\" ] && \\. \"$NVM_DIR/nvm.sh\" "
            "&& pm2 restart bebrilliant-next --update-env",
            "Restart bebrilliant-next")

        print("\n==============================================")
        print("   SIDEBAR LOGOUT FIX DEPLOYED SUCCESSFULLY")
        print("==============================================")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    main()

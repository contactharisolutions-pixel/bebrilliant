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

        # Upload the files
        sftp = ssh.open_sftp()
        
        files_to_upload = [
            ("src/lib/supabase/admin.ts", "/var/www/bebrilliant/src/lib/supabase/admin.ts"),
            ("src/app/owner/finance/page.tsx", "/var/www/bebrilliant/src/app/owner/finance/page.tsx"),
            ("src/app/owner/payments/page.tsx", "/var/www/bebrilliant/src/app/owner/payments/page.tsx"),
            ("src/app/owner/sales/page.tsx", "/var/www/bebrilliant/src/app/owner/sales/page.tsx"),
            ("src/app/owner/analytics/page.tsx", "/var/www/bebrilliant/src/app/owner/analytics/page.tsx")
        ]

        for local, remote in files_to_upload:
            print(f"Uploading {local} to {remote}...")
            sftp.put(f"d:\\MyProjects\\BeBrilliant\\{local.replace('/', '\\')}", remote)
            print(f"[OK] Uploaded {local}")
            
        sftp.close()

        # Rebuild Next.js app
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
        print("   FINANCIAL DETAILS & API FIX DEPLOYED SUCCESSFULLY")
        print("==============================================")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    main()

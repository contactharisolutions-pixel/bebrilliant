import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko
import os

VPS_IP = "89.116.33.188"
VPS_USER = "root"
VPS_PASS = "Life@20242526"

FILES_TO_UPLOAD = [
    ("src/middleware.ts", "/var/www/bebrilliant/src/middleware.ts"),
    ("src/lib/platform-auth.ts", "/var/www/bebrilliant/src/lib/platform-auth.ts"),
    ("src/components/owner/OwnerSidebar.tsx", "/var/www/bebrilliant/src/components/owner/OwnerSidebar.tsx"),
    ("src/app/owner/rbac/page.tsx", "/var/www/bebrilliant/src/app/owner/rbac/page.tsx"),
    ("src/app/api/owner/cms/route.ts", "/var/www/bebrilliant/src/app/api/owner/cms/route.ts"),
    ("src/app/api/owner/crm/leads/route.ts", "/var/www/bebrilliant/src/app/api/owner/crm/leads/route.ts"),
    ("src/app/api/owner/finance/route.ts", "/var/www/bebrilliant/src/app/api/owner/finance/route.ts"),
    ("src/app/api/owner/rbac/route.ts", "/var/www/bebrilliant/src/app/api/owner/rbac/route.ts"),
    ("src/app/api/owner/rbac/me/route.ts", "/var/www/bebrilliant/src/app/api/owner/rbac/me/route.ts"),
    ("src/app/api/owner/rbac/users/[id]/route.ts", "/var/www/bebrilliant/src/app/api/owner/rbac/users/[id]/route.ts")
]

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

        # Ensure directories exist
        print("\nEnsuring target directories exist on VPS...")
        run_cmd(ssh, "mkdir -p /var/www/bebrilliant/src/lib /var/www/bebrilliant/src/app/api/owner/rbac/me /var/www/bebrilliant/src/app/api/owner/rbac/users/[id]")

        # Upload files
        sftp = ssh.open_sftp()
        local_base = r"d:\MyProjects\BeBrilliant"
        for local_rel, remote_path in FILES_TO_UPLOAD:
            local_path = os.path.join(local_base, local_rel.replace('/', '\\'))
            print(f"Uploading {local_path} -> {remote_path} ...")
            sftp.put(local_path, remote_path)
        print("[OK] All files uploaded successfully.")
        sftp.close()

        # Rebuild Next.js
        run_cmd(ssh,
            "export NVM_DIR=\"$HOME/.nvm\" && [ -s \"$NVM_DIR/nvm.sh\" ] && \\. \"$NVM_DIR/nvm.sh\" "
            "&& cd /var/www/bebrilliant && npm run build",
            "Rebuild Next.js app on VPS")

        # Restart in PM2
        run_cmd(ssh,
            "export NVM_DIR=\"$HOME/.nvm\" && [ -s \"$NVM_DIR/nvm.sh\" ] && \\. \"$NVM_DIR/nvm.sh\" "
            "&& pm2 restart bebrilliant-next --update-env",
            "Restart bebrilliant-next app under PM2")

        print("\n==============================================")
        print("     RBAC STAFF CONSOLIDATION UPDATE DEPLOYED")
        print("==============================================")

    except Exception as e:
        print(f"Error during deployment: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    main()

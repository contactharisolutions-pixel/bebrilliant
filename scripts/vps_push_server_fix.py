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

        # Upload the fixed server.js
        sftp = ssh.open_sftp()
        sftp.put(r"d:\MyProjects\BeBrilliant\server.js", "/var/www/bebrilliant/server.js")
        print("[OK] Uploaded fixed server.js to VPS.")
        sftp.close()

        # Restart bebrilliant-express
        run_cmd(ssh,
            "export NVM_DIR=\"$HOME/.nvm\" && [ -s \"$NVM_DIR/nvm.sh\" ] && \\. \"$NVM_DIR/nvm.sh\" "
            "&& cd /var/www/bebrilliant && pm2 restart bebrilliant-express --update-env",
            "Restart bebrilliant-express")

        # Wait and check port binding
        run_cmd(ssh,
            "sleep 5 && ss -tlnp | grep -E '5174|5175'",
            "Check listening port 5175 after restart")

        # Test the shop subdomain
        run_cmd(ssh,
            "curl -o /dev/null -s -w 'shop.bebrilliant.in HTTP Status: %{http_code}\\n' -L https://shop.bebrilliant.in",
            "Test shop.bebrilliant.in HTTPS")

        # Test main domain too
        run_cmd(ssh,
            "curl -o /dev/null -s -w 'bebrilliant.in HTTP Status: %{http_code}\\n' -L https://bebrilliant.in",
            "Test bebrilliant.in HTTPS")

        # Show final PM2 status
        run_cmd(ssh,
            "export NVM_DIR=\"$HOME/.nvm\" && [ -s \"$NVM_DIR/nvm.sh\" ] && \\. \"$NVM_DIR/nvm.sh\" "
            "&& pm2 list | grep bebrilliant",
            "Final PM2 status")

        # Save PM2 config
        run_cmd(ssh,
            "export NVM_DIR=\"$HOME/.nvm\" && [ -s \"$NVM_DIR/nvm.sh\" ] && \\. \"$NVM_DIR/nvm.sh\" && pm2 save",
            "Save PM2 process list")

        print("\n==============================================")
        print("   SERVER.JS FIX DEPLOYED SUCCESSFULLY")
        print("==============================================")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    main()

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

        # 1. Add PORT=5175 and NODE_ENV=production to .env.production
        # Use sed to add/update PORT line, or append if not present
        run_cmd(ssh,
            "grep -q '^PORT=' /var/www/bebrilliant/.env.production "
            "&& sed -i 's/^PORT=.*/PORT=5175/' /var/www/bebrilliant/.env.production "
            "|| echo 'PORT=5175' >> /var/www/bebrilliant/.env.production",
            "Set PORT=5175 in .env.production")

        run_cmd(ssh,
            "grep -q '^NODE_ENV=' /var/www/bebrilliant/.env.production "
            "&& sed -i 's/^NODE_ENV=.*/NODE_ENV=production/' /var/www/bebrilliant/.env.production "
            "|| echo 'NODE_ENV=production' >> /var/www/bebrilliant/.env.production",
            "Set NODE_ENV=production in .env.production")

        # 2. Verify the values are now set
        run_cmd(ssh,
            "grep -E '^PORT=|^NODE_ENV=' /var/www/bebrilliant/.env.production",
            "Verify .env.production entries")

        # 3. Restart bebrilliant-express with --update-env so it picks up production env
        run_cmd(ssh,
            "export NVM_DIR=\"$HOME/.nvm\" && [ -s \"$NVM_DIR/nvm.sh\" ] && \\. \"$NVM_DIR/nvm.sh\" "
            "&& cd /var/www/bebrilliant "
            "&& pm2 restart bebrilliant-express --update-env",
            "Restart bebrilliant-express with updated env")

        # 4. Wait a moment and check status
        run_cmd(ssh,
            "sleep 3 && export NVM_DIR=\"$HOME/.nvm\" && [ -s \"$NVM_DIR/nvm.sh\" ] && \\. \"$NVM_DIR/nvm.sh\" "
            "&& pm2 list | grep bebrilliant",
            "PM2 status after restart")

        # 5. Check which port Express is now bound to
        run_cmd(ssh,
            "ss -tlnp | grep -E '5174|5175'",
            "Check listening ports 5174/5175")

        # 6. Test shop subdomain
        run_cmd(ssh,
            "curl -o /dev/null -s -w 'shop.bebrilliant.in HTTP Status: %{http_code}\\n' -L https://shop.bebrilliant.in",
            "Test shop.bebrilliant.in")

        print("\n==============================================")
        print("   EXPRESS PORT FIX COMPLETE")
        print("==============================================")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    main()

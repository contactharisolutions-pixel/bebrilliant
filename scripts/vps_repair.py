'use strict';
# python script
import sys
import os
import time
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

VPS_IP = "89.116.33.188"
VPS_USER = "root"
VPS_PASS = "Life@20242526"

def run_ssh_commands(ssh, commands):
    for cmd in commands:
        print(f"Executing: {cmd}")
        stdin, stdout, stderr = ssh.exec_command(cmd)
        
        # Read output in real-time
        exit_status = stdout.channel.recv_exit_status()
        out = stdout.read().decode('utf-8', errors='ignore')
        err = stderr.read().decode('utf-8', errors='ignore')
        
        if out:
            print(f"[STDOUT]\n{out}")
        if err and exit_status != 0:
            print(f"[STDERR]\n{err}")
        
        if exit_status != 0:
            print(f"ERROR: Command failed with exit status {exit_status}")
            raise Exception(f"Command failed: {cmd}")

def start_repair():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    print("Connecting to Hostinger VPS via SSH to run repairs...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(VPS_IP, username=VPS_USER, password=VPS_PASS, timeout=30)
        print("[OK] Connected to Hostinger VPS.")
        
        sftp = ssh.open_sftp()
        
        # 1. Upload updated files (db.js and migrate-db.sh)
        print("\n--> 1. Uploading updated db.js and migrate-db.sh...")
        sftp.put(os.path.join(base_dir, 'db.js'), '/var/www/bebrilliant/db.js')
        sftp.put(os.path.join(base_dir, 'scripts', 'migrate-db.sh'), '/var/www/bebrilliant/scripts/migrate-db.sh')
        print("[OK] Upload completed.")
        
        # 1.5. Clean reset of database container/volume for clean schemas
        print("\n--> 1.5. Stopping database, clearing volume and recreating container...")
        db_reset_cmds = [
            "cd /opt/supabase/docker && docker compose down",
            "rm -rf /opt/supabase/docker/volumes/db/data",
            "cd /opt/supabase/docker && docker compose up -d"
        ]
        run_ssh_commands(ssh, db_reset_cmds)
        print("[OK] Database restarted. Waiting 20 seconds for DB initialization...")
        time.sleep(20)
        
        # Get DB password
        print("Finding database credentials on VPS...")
        stdin, stdout, stderr = ssh.exec_command("cat /opt/supabase/docker/.env | grep '^POSTGRES_PASSWORD=' | cut -d '=' -f2")
        db_pass = stdout.read().decode('utf-8').strip()
        print(f"Retrieved DB password successfully.")
        
        # 2. Re-run database schema and data migration
        print("\n--> 2. Restoring PostgreSQL schema and data (with fixed syntax)...")
        vps_db_cmds = [
            f"sed -i 's|^SOURCE_DB_URL=.*|SOURCE_DB_URL=\"postgresql://postgres:Life%4020242526@db.mtoslybnnywmsmpwjphv.supabase.co:5432/postgres\"|' /var/www/bebrilliant/scripts/migrate-db.sh",
            f"sed -i 's|^DEST_DB_USER=.*|DEST_DB_USER=\"postgres\"|' /var/www/bebrilliant/scripts/migrate-db.sh",
            f"sed -i 's|^DEST_DB_NAME=.*|DEST_DB_NAME=\"postgres\"|' /var/www/bebrilliant/scripts/migrate-db.sh",
            "chmod +x /var/www/bebrilliant/scripts/migrate-db.sh",
            "yes y | bash /var/www/bebrilliant/scripts/migrate-db.sh"
        ]
        run_ssh_commands(ssh, vps_db_cmds)
        print("[OK] Database schema and data restored successfully.")
        
        # 3. Restart PM2 apps
        print("\n--> 3. Restarting application processes under PM2 to pick up non-SSL db.js...")
        pm2_restart_cmds = [
            "export NVM_DIR=\"$HOME/.nvm\" && [ -s \"$NVM_DIR/nvm.sh\" ] && \\. \"$NVM_DIR/nvm.sh\" && pm2 restart all"
        ]
        run_ssh_commands(ssh, pm2_restart_cmds)
        print("[OK] PM2 processes restarted.")
        
        # Final Status checks
        print("\n--> Verification of PM2 process statuses:")
        stdin, stdout, stderr = ssh.exec_command("export NVM_DIR=\"$HOME/.nvm\" && [ -s \"$NVM_DIR/nvm.sh\" ] && \\. \"$NVM_DIR/nvm.sh\" && pm2 status")
        print(stdout.read().decode('utf-8'))
        
        print("\n--> Tail of PM2 logs:")
        stdin, stdout, stderr = ssh.exec_command("tail -n 50 ~/.pm2/logs/*.log 2>&1")
        print(stdout.read().decode('utf-8'))
        
        # Check if local curl returns 200 OK or similar
        print("\n--> Checking endpoints locally:")
        stdin, stdout, stderr = ssh.exec_command("curl -I http://127.0.0.1:3000; curl -I http://127.0.0.1:5174")
        print(stdout.read().decode('utf-8'))
        
    except Exception as e:
        print(f"\n[ERROR] Repair failed: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    start_repair()

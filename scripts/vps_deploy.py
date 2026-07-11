'use strict';
# python script
import os
import sys
sys.stdout.reconfigure(encoding='utf-8')
import zipfile
import paramiko
# Removed top-level import of scp to avoid import failure before install

VPS_IP = "89.116.33.188"
VPS_USER = "root"
VPS_PASS = "Life@20242526"

CODEBASE_ZIP_NAME = "bebrilliant_codebase.zip"
STORAGE_ZIP_NAME = "bebrilliant_storage_migration.zip"

EXCLUDE_DIRS = {'.git', 'node_modules', '.next', 'migration_storage', 'tmp', '.gemini', '.agents', '.agent'}
EXCLUDE_FILES = {CODEBASE_ZIP_NAME, STORAGE_ZIP_NAME}

def zip_codebase(zip_filename):
    print("--> 1. Compressing codebase (excluding heavy directories)...")
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    
    with zipfile.ZipFile(os.path.join(base_dir, zip_filename), 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(base_dir):
            # Exclude folders
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
            
            for file in files:
                if file in EXCLUDE_FILES:
                    continue
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, base_dir)
                zipf.write(file_path, arcname)
                
    print(f"[OK] Codebase zipped successfully as {zip_filename}")

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

def start_deployment():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    zip_codebase(CODEBASE_ZIP_NAME)
    
    # Check if storage zip exists
    storage_zip_path = os.path.join(base_dir, STORAGE_ZIP_NAME)
    has_storage = False

        
    print("\nConnecting to VPS via SSH...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(VPS_IP, username=VPS_USER, password=VPS_PASS, timeout=30)
        print("[OK] Connected to Hostinger VPS successfully.")
        
        # Upload Zips
        print("\n--> 2. Uploading codebase and assets to VPS /tmp/...")
        from scp import SCPClient
        with SCPClient(ssh.get_transport()) as scp:
            scp.put(os.path.join(base_dir, CODEBASE_ZIP_NAME), f"/tmp/{CODEBASE_ZIP_NAME}")
            if has_storage:
                print("Uploading storage migration zip (this may take a minute)...")
                scp.put(storage_zip_path, f"/tmp/{STORAGE_ZIP_NAME}")
        print("[OK] Files uploaded successfully.")
        
        # Deploy commands on VPS
        print("\n--> 3. Configuring VPS environments & running services...")
        vps_commands = [
            # 1. Update and install base tools
            "apt-get update",
            "apt-get install -y unzip zip curl git nginx pglog || apt-get install -y unzip zip curl git nginx postgresql-client",
            
            # 2. Setup Node.js (nvm) & PM2
            "curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash",
            "export NVM_DIR=\"$HOME/.nvm\" && [ -s \"$NVM_DIR/nvm.sh\" ] && \\. \"$NVM_DIR/nvm.sh\" && nvm install 20 && nvm use 20 && npm install -g pm2",
            
            # 3. Create deploy dir and unzip
            "mkdir -p /var/www/bebrilliant",
            f"unzip -o /tmp/{CODEBASE_ZIP_NAME} -d /var/www/bebrilliant",
            
            # 4. Install Node dependencies
            "export NVM_DIR=\"$HOME/.nvm\" && [ -s \"$NVM_DIR/nvm.sh\" ] && \\. \"$NVM_DIR/nvm.sh\" && cd /var/www/bebrilliant && npm install",
            
            # 5. Move Nginx Configuration (only if no SSL config exists yet — avoid wiping Certbot HTTPS blocks)
            "if ! grep -q 'ssl_certificate' /etc/nginx/sites-available/bebrilliant 2>/dev/null; then cp /var/www/bebrilliant/nginx/bebrilliant.conf /etc/nginx/sites-available/bebrilliant && echo 'Nginx base config installed'; else echo 'SSL config already present — skipping template copy'; fi",
            "ln -sf /etc/nginx/sites-available/bebrilliant /etc/nginx/sites-enabled/bebrilliant",
            "rm -f /etc/nginx/sites-enabled/default",
            "nginx -t && systemctl reload nginx",
            
            # 6. Verify Docker & Docker Compose are installed
            "if ! command -v docker &> /dev/null; then curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh; fi",
            "docker compose version || apt-get install -y docker-compose-plugin",
            
            # 7. Setup self-hosted Supabase Stack directories
            "if [ ! -d \"/opt/supabase\" ]; then git clone --depth 1 https://github.com/supabase/supabase.git /opt/supabase; fi",
            "cp -r /var/www/bebrilliant/supabase /opt/supabase/docker/ || true",
            
            # 8. Rebuild Next.js app on VPS
            "export NVM_DIR=\"$HOME/.nvm\" && [ -s \"$NVM_DIR/nvm.sh\" ] && \\. \"$NVM_DIR/nvm.sh\" && cd /var/www/bebrilliant && npm run build",
            
            # 9. Start/Restart PM2 applications using ecosystem.config.js
            "export NVM_DIR=\"$HOME/.nvm\" && [ -s \"$NVM_DIR/nvm.sh\" ] && \\. \"$NVM_DIR/nvm.sh\" && cd /var/www/bebrilliant && pm2 restart ecosystem.config.js --update-env || pm2 start ecosystem.config.js"
        ]

        
        run_ssh_commands(ssh, vps_commands)
        
        print("\n=====================================================")
        print("          VPS Initial Provisioning Complete          ")
        print("=====================================================")
        print("To complete the Supabase DB and Storage setup:")
        print("1. SSH into the VPS: ssh root@89.116.33.188")
        print("2. Navigate to /opt/supabase/docker and configure the credentials in `.env` as detailed in `/var/www/bebrilliant/supabase/VPS_SETUP.md`.")
        print("3. Start Supabase: `docker compose up -d`")
        print("4. Execute the DB restore script: `bash /var/www/bebrilliant/scripts/migrate-db.sh`")
        print("5. Extract storage files: `unzip /tmp/bebrilliant_storage_migration.zip -d /tmp/ && cp -r /tmp/migration_storage/* /opt/supabase/docker/volumes/storage/` and fix permissions: `chown -R 1000:1000 /opt/supabase/docker/volumes/storage`.")
        print("6. Run the applications under PM2: `cd /var/www/bebrilliant && pm2 start ecosystem.config.js`.")
        print("=====================================================")
        
    except Exception as e:
        print(f"\n[ERROR] Deployment process interrupted: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    # Ensure SCP client helper is installed in Python environment
    try:
        import scp
    except ImportError:
        print("Installing scp python module...")
        os.system("pip install scp")
        
    start_deployment()

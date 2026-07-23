import os
import sys
sys.stdout.reconfigure(encoding='utf-8')
import zipfile
import paramiko

VPS_IP = "89.116.33.188"
VPS_USER = "root"
VPS_PASS = "Life@20242526"

CODEBASE_ZIP_NAME = "bebrilliant_codebase.zip"

EXCLUDE_DIRS = {'.git', 'node_modules', '.next', 'migration_storage', 'tmp', '.gemini', '.agents', '.agent'}
EXCLUDE_FILES = {CODEBASE_ZIP_NAME}

def zip_codebase(zip_filename):
    print("--> 1. Compressing codebase (excluding heavy directories)...")
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    
    with zipfile.ZipFile(os.path.join(base_dir, zip_filename), 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(base_dir):
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
        print(f"\nExecuting: {cmd}")
        stdin, stdout, stderr = ssh.exec_command(cmd)
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
    
    print("\nConnecting to Hostinger VPS via SSH...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(VPS_IP, username=VPS_USER, password=VPS_PASS, timeout=30)
        print("[OK] Connected successfully.")
        
        # Upload Zip
        print("\n--> 2. Uploading codebase zip to VPS...")
        sftp = ssh.open_sftp()
        sftp.put(os.path.join(base_dir, CODEBASE_ZIP_NAME), f"/tmp/{CODEBASE_ZIP_NAME}")
        sftp.close()
        print("[OK] Codebase zip uploaded.")
        
        # Deploy commands on VPS
        print("\n--> 3. Unzipping, rebuilding Next.js, and restarting PM2 servers...")
        vps_commands = [
            # 1. Unzip codebase
            f"unzip -o /tmp/{CODEBASE_ZIP_NAME} -d /var/www/bebrilliant",
            
            # 2. Rebuild Next.js app on VPS
            "export NVM_DIR=\"$HOME/.nvm\" && [ -s \"$NVM_DIR/nvm.sh\" ] && \\. \"$NVM_DIR/nvm.sh\" && cd /var/www/bebrilliant && npm run build",
            
            # 3. Restart PM2 processes
            "export NVM_DIR=\"$HOME/.nvm\" && [ -s \"$NVM_DIR/nvm.sh\" ] && \\. \"$NVM_DIR/nvm.sh\" && cd /var/www/bebrilliant && pm2 restart bebrilliant-next",
            "export NVM_DIR=\"$HOME/.nvm\" && [ -s \"$NVM_DIR/nvm.sh\" ] && \\. \"$NVM_DIR/nvm.sh\" && cd /var/www/bebrilliant && pm2 restart bebrilliant-express"
        ]
        
        run_ssh_commands(ssh, vps_commands)
        print("\n==============================================")
        print("   REDEPLOYMENT TO HOSTINGER VPS COMPLETED    ")
        print("==============================================")
        
    except Exception as e:
        print(f"\n[ERROR] Deployment process failed: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    start_deployment()

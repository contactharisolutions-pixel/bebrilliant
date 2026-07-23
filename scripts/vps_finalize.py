'use strict';
# python script
import os
import secrets
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
            print(f"[STDOUT]\n{out.encode('ascii', errors='replace').decode('ascii')}")
        if err and exit_status != 0:
            print(f"[STDERR]\n{err.encode('ascii', errors='replace').decode('ascii')}")
        
        if exit_status != 0:
            print(f"ERROR: Command failed with exit status {exit_status}")
            raise Exception(f"Command failed: {cmd}")

def start_finalization():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    print("Connecting to VPS via SSH...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(VPS_IP, username=VPS_USER, password=VPS_PASS, timeout=30)
        print("[OK] Connected to Hostinger VPS successfully.")
        
        # Step 1: Generate Secrets and JWT Keys on the VPS using Node.js
        print("\n--> 1. Generating local JWT and Database Secrets on VPS...")
        postgres_password = secrets.token_hex(24)
        jwt_secret = secrets.token_hex(32)
        
        # We will write a tiny Node.js script on the VPS to generate signed JWT tokens
        node_jwt_script = f"""
const crypto = require('crypto');

const secret = '{jwt_secret}';
const anonPayload = {{ role: 'anon', iss: 'supabase', iat: 1776279385, exp: 2091855385 }};
const servicePayload = {{ role: 'service_role', iss: 'supabase', iat: 1776279385, exp: 2091855385 }};

function sign(payload, secretKey) {{
    const header = {{ alg: 'HS256', typ: 'JWT' }};
    const base64Url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
    const unsigned = base64Url(header) + '.' + base64Url(payload);
    const signature = crypto.createHmac('sha256', secretKey).update(unsigned).digest('base64url');
    return unsigned + '.' + signature;
}}

console.log('ANON_KEY:' + sign(anonPayload, secret));
console.log('SERVICE_ROLE_KEY:' + sign(servicePayload, secret));
"""
        # Save node script on VPS and execute it
        sftp = ssh.open_sftp()
        with sftp.file('/tmp/gen_jwt.js', 'w') as f:
            f.write(node_jwt_script)
            
        stdin, stdout, stderr = ssh.exec_command('export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh" && node /tmp/gen_jwt.js')
        out = stdout.read().decode('utf-8').strip()
        
        anon_key = ""
        service_role_key = ""
        for line in out.split('\n'):
            if line.startswith('ANON_KEY:'):
                anon_key = line.split('ANON_KEY:')[1].strip()
            elif line.startswith('SERVICE_ROLE_KEY:'):
                service_role_key = line.split('SERVICE_ROLE_KEY:')[1].strip()
                
        if not anon_key or not service_role_key:
            raise Exception("Failed to generate JWT keys on VPS via Node.js")
            
        print("[OK] Secrets and keys generated successfully.")
        
        # Step 2: Configure Supabase .env file on VPS
        print("\n--> 2. Configuring Supabase Docker stack settings...")
        supabase_env_cmds = [
            "cp /opt/supabase/docker/.env.example /opt/supabase/docker/.env",
            f"sed -i 's/^POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD={postgres_password}/' /opt/supabase/docker/.env",
            f"sed -i 's/^JWT_SECRET=.*/JWT_SECRET={jwt_secret}/' /opt/supabase/docker/.env",
            f"sed -i 's/^ANON_KEY=.*/ANON_KEY={anon_key}/' /opt/supabase/docker/.env",
            f"sed -i 's/^SERVICE_ROLE_KEY=.*/SERVICE_ROLE_KEY={service_role_key}/' /opt/supabase/docker/.env",
            
            # Hostinger SMTP Setup
            "sed -i 's/^SMTP_ADMIN_EMAIL=.*/SMTP_ADMIN_EMAIL=support@bebrilliant.in/' /opt/supabase/docker/.env",
            "sed -i 's/^SMTP_HOST=.*/SMTP_HOST=smtp.hostinger.com/' /opt/supabase/docker/.env",
            "sed -i 's/^SMTP_PORT=.*/SMTP_PORT=465/' /opt/supabase/docker/.env",
            "sed -i 's/^SMTP_USER=.*/SMTP_USER=support@bebrilliant.in/' /opt/supabase/docker/.env",
            "sed -i 's/^SMTP_PASS=.*/SMTP_PASS=Blink@2026/' /opt/supabase/docker/.env",
            "sed -i 's/^SMTP_SENDER_NAME=.*/SMTP_SENDER_NAME=BeBrilliant/' /opt/supabase/docker/.env",
            "sed -i 's/^ENABLE_EMAIL_SIGNUP=.*/ENABLE_EMAIL_SIGNUP=true/' /opt/supabase/docker/.env",
            "sed -i 's/^ENABLE_EMAIL_CONFIRMATIONS=.*/ENABLE_EMAIL_CONFIRMATIONS=false/' /opt/supabase/docker/.env",
            
            # Increase Storage File size limit to 100MB
            "sed -i 's/^STORAGE_FILE_SIZE_LIMIT_MB=.*/STORAGE_FILE_SIZE_LIMIT_MB=100/' /opt/supabase/docker/.env"
        ]
        run_ssh_commands(ssh, supabase_env_cmds)
        print("[OK] Supabase docker .env configured.")
        
        # Step 3: Boot Supabase stack
        print("\n--> 3. Booting Supabase Docker stack (please wait)...")
        run_ssh_commands(ssh, ["cd /opt/supabase/docker && docker compose up -d"])
        print("[OK] Supabase services are online.")
        
        # Step 4: Setup application env files
        print("\n--> 4. Setting up application environment files (.env.production)...")
        app_env_content = f"""
# Local Supabase Services
SUPABASE_URL="http://localhost:8000"
SUPABASE_ANON_KEY="{anon_key}"
SUPABASE_SERVICE_ROLE_KEY="{service_role_key}"
DATABASE_URL="postgresql://postgres:{postgres_password}@localhost:5432/postgres"

# Next.js Public Access Configuration
NEXT_PUBLIC_SUPABASE_URL="https://supabase.bebrilliant.in"
NEXT_PUBLIC_SUPABASE_ANON_KEY="{anon_key}"

# Razorpay Production Keys
RAZORPAY_KEY_ID="rzp_live_zjeiubuGNL14xv"
RAZORPAY_SECRET_KEY="j26rdLomMP9S6jS1Wkh4eWQk"

# Hostinger SMTP Configuration
SMTP_HOST="smtp.hostinger.com"
SMTP_PORT=465
SMTP_USER="support@bebrilliant.in"
SMTP_PASS="Life@20242526"

# Security
JWT_SECRET="BeBrilliant_SuperSecret_2026_ProdKey"

# AI & External APIs
GEMINI_API_KEY="AIzaSyB6MxW-dfjVgy-5RQDdcbTT5BPCc3Zko5s"
TZ=Asia/Kolkata
"""
        with sftp.file('/var/www/bebrilliant/.env.production', 'w') as f:
            f.write(app_env_content.strip())
            
        print("[OK] Application .env.production configured.")
        
        # Step 5: Restore DB using migrate-db.sh (auto-confirm via yes)
        print("\n--> 5. Restoring PostgreSQL schema and live data...")
        sftp.put(os.path.join(base_dir, 'scripts', 'migrate-db.sh'), '/var/www/bebrilliant/scripts/migrate-db.sh')
        # Update connection strings in migrate-db.sh before running it
        vps_db_cmds = [
            f"sed -i 's|^SOURCE_DB_URL=.*|SOURCE_DB_URL=\"postgresql://postgres:Life%4020242526@db.mtoslybnnywmsmpwjphv.supabase.co:5432/postgres\"|' /var/www/bebrilliant/scripts/migrate-db.sh",
            f"sed -i 's|^DEST_DB_USER=.*|DEST_DB_USER=\"postgres\"|' /var/www/bebrilliant/scripts/migrate-db.sh",
            f"sed -i 's|^DEST_DB_NAME=.*|DEST_DB_NAME=\"postgres\"|' /var/www/bebrilliant/scripts/migrate-db.sh",
            "chmod +x /var/www/bebrilliant/scripts/migrate-db.sh",
            "yes y | bash /var/www/bebrilliant/scripts/migrate-db.sh"
        ]
        run_ssh_commands(ssh, vps_db_cmds)
        print("[OK] Schema and data restored.")
        
        # Step 6: Extract Storage Files
        print("\n--> 6. Restoring local storage assets...")
        vps_storage_cmds = [
            "unzip -o /tmp/bebrilliant_storage_migration.zip -d /tmp/ || true",
            "mkdir -p /opt/supabase/docker/volumes/storage",
            "cp -r /tmp/migration_storage/* /opt/supabase/docker/volumes/storage/",
            "chown -R 1000:1000 /opt/supabase/docker/volumes/storage"
        ]
        run_ssh_commands(ssh, vps_storage_cmds)
        print("[OK] Storage files restored.")
        
        # Step 7: PM2 Start Applications
        print("\n--> 7. Deploying PM2 system processes...")
        vps_pm2_cmds = [
            "export NVM_DIR=\"$HOME/.nvm\" && [ -s \"$NVM_DIR/nvm.sh\" ] && \\. \"$NVM_DIR/nvm.sh\" && cd /var/www/bebrilliant && pm2 delete all || true",
            "export NVM_DIR=\"$HOME/.nvm\" && [ -s \"$NVM_DIR/nvm.sh\" ] && \\. \"$NVM_DIR/nvm.sh\" && cd /var/www/bebrilliant && pm2 start ecosystem.config.js --env production",
            "export NVM_DIR=\"$HOME/.nvm\" && [ -s \"$NVM_DIR/nvm.sh\" ] && \\. \"$NVM_DIR/nvm.sh\" && pm2 save"
        ]
        run_ssh_commands(ssh, vps_pm2_cmds)
        print("[OK] Next.js and Express apps are running under PM2.")
        
        # Final status report
        print("\n=====================================================")
        print("          MIGRATION EXECUTED SUCCESSFULLY            ")
        print("=====================================================")
        print("Your applications are live and operational on Hostinger VPS!")
        print(f"Main & Dashboard URL : http://{VPS_IP} (Point DNS to bebrilliant.in)")
        print(f"Storefront API URL   : http://{VPS_IP}:5174 (Point DNS to shop.bebrilliant.in)")
        print(f"Supabase Studio URL  : http://{VPS_IP}:8001 (Studio panel)")
        print("\nTo complete SSL provisioning via Certbot:")
        print("1. Map your domain names (DNS) to the VPS IP.")
        print("2. Run the certbot command on your VPS:")
        print(f"   certbot --nginx -d bebrilliant.in -d www.bebrilliant.in -d shop.bebrilliant.in -d supabase.bebrilliant.in")
        print("=====================================================")
        
    except Exception as e:
        print(f"\n[ERROR] Migration finalization failed: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    start_finalization()

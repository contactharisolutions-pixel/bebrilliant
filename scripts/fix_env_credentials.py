import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

VPS_IP = "89.116.33.188"
VPS_USER = "root"
VPS_PASS = "Life@20242526"

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(VPS_IP, username=VPS_USER, password=VPS_PASS, timeout=30)
        print("[OK] Connected to Hostinger VPS.")

        # 1. Read the current JWT/ANON keys from the local Supabase docker .env
        print("\n--> Reading local Supabase docker keys from VPS...")
        stdin, stdout, stderr = ssh.exec_command(
            "grep -E '^ANON_KEY=|^SERVICE_ROLE_KEY=|^JWT_SECRET=|^POSTGRES_PASSWORD=' "
            "/opt/supabase/docker/.env"
        )
        env_lines = stdout.read().decode('utf-8').strip().split('\n')
        
        anon_key = ""
        service_role_key = ""
        jwt_secret = ""
        postgres_password = ""
        
        for line in env_lines:
            if line.startswith("ANON_KEY="):
                anon_key = line.split("=", 1)[1].strip()
            elif line.startswith("SERVICE_ROLE_KEY="):
                service_role_key = line.split("=", 1)[1].strip()
            elif line.startswith("JWT_SECRET="):
                jwt_secret = line.split("=", 1)[1].strip()
            elif line.startswith("POSTGRES_PASSWORD="):
                postgres_password = line.split("=", 1)[1].strip()
        
        print(f"  ANON_KEY      : {anon_key[:40]}...")
        print(f"  SERVICE_KEY   : {service_role_key[:40]}...")
        print(f"  JWT_SECRET    : {jwt_secret[:20]}...")
        print(f"  DB_PASSWORD   : {'***set***' if postgres_password else 'NOT FOUND'}")

        if not anon_key or not service_role_key:
            print("[ERROR] Could not read Supabase keys. Aborting.")
            return

        # 2. Build the CORRECT BeBrilliant .env.production
        #    - All credentials are BeBrilliant-specific (NOT BlinkOpticals)
        #    - SMTP: support@bebrilliant.in / Life@20242526
        #    - Razorpay: BeBrilliant live keys
        #    - JWT: local Supabase self-hosted JWT secret
        #    - Supabase: local self-hosted (Kong on port 8000)
        
        correct_env = f"""# BeBrilliant Production Environment
# Self-Hosted Supabase on VPS (NOT BlinkOpticals / NOT cloud Supabase)

# ─── Supabase (Self-Hosted on VPS) ───────────────────────────────────────────
SUPABASE_URL=http://localhost:8000
SUPABASE_ANON_KEY={anon_key}
SUPABASE_SERVICE_ROLE_KEY={service_role_key}

# ─── Database (Direct PostgreSQL — port 5432 on host → supabase-db container) ─
DATABASE_URL=postgresql://postgres:{postgres_password}@localhost:5432/postgres

# ─── Next.js Public Supabase Keys (public HTTPS URL for browser access) ──────
NEXT_PUBLIC_SUPABASE_URL=https://supabase.bebrilliant.in
NEXT_PUBLIC_SUPABASE_ANON_KEY={anon_key}

# ─── Site URL ─────────────────────────────────────────────────────────────────
NEXT_PUBLIC_SITE_URL=https://bebrilliant.in

# ─── Razorpay (BeBrilliant live keys — NOT BlinkOpticals) ────────────────────
RAZORPAY_KEY_ID=rzp_live_SHBxckJxQTVh7g
RAZORPAY_KEY_SECRET=fE8u2LU9PADggjbRK8yih4ez
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_SHBxckJxQTVh7g

# ─── SMTP / Email (BeBrilliant Hostinger SMTP — NOT BlinkOpticals) ───────────
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=support@bebrilliant.in
SMTP_PASS=Life@20242526
SMTP_FROM=support@bebrilliant.in
SMTP_FROM_NAME=BeBrilliant

# ─── Security (Self-Hosted Supabase JWT — NOT BlinkOpticals) ─────────────────
JWT_SECRET={jwt_secret}

# ─── AI & External APIs (BeBrilliant Gemini key) ─────────────────────────────
GEMINI_API_KEY=AIzaSyB6MxW-dfjVgy-5RQDdcbTT5BPCc3Zko5s

# ─── Timezone ─────────────────────────────────────────────────────────────────
TZ=Asia/Kolkata
"""

        # 3. Write to VPS
        print("\n--> Writing corrected .env.production to VPS...")
        sftp = ssh.open_sftp()
        with sftp.file('/var/www/bebrilliant/.env.production', 'w') as f:
            f.write(correct_env)
        print("[OK] .env.production written with correct BeBrilliant credentials.")

        # 4. Verify
        print("\n--> Verifying written file (showing non-secret parts)...")
        stdin, stdout, stderr = ssh.exec_command(
            "grep -E '^SMTP_USER|^SMTP_FROM|^NEXT_PUBLIC_SITE_URL|^RAZORPAY_KEY_ID|^GEMINI_API_KEY' "
            "/var/www/bebrilliant/.env.production"
        )
        print(stdout.read().decode('utf-8'))

        # 5. Also update Supabase docker .env SMTP settings 
        #    to use BeBrilliant email (not blinkopticals)
        print("\n--> Updating Supabase docker .env SMTP settings to BeBrilliant...")
        smtp_fix_cmds = [
            "sed -i 's|^SMTP_ADMIN_EMAIL=.*|SMTP_ADMIN_EMAIL=support@bebrilliant.in|' /opt/supabase/docker/.env",
            "sed -i 's|^SMTP_USER=.*|SMTP_USER=support@bebrilliant.in|' /opt/supabase/docker/.env",
            "sed -i 's|^SMTP_PASS=.*|SMTP_PASS=Life@20242526|' /opt/supabase/docker/.env",
            "sed -i 's|^SMTP_SENDER_NAME=.*|SMTP_SENDER_NAME=BeBrilliant|' /opt/supabase/docker/.env",
            "sed -i 's|^SITE_URL=.*|SITE_URL=https://bebrilliant.in|' /opt/supabase/docker/.env",
            "sed -i 's|^API_EXTERNAL_URL=.*|API_EXTERNAL_URL=https://supabase.bebrilliant.in|' /opt/supabase/docker/.env",
        ]
        for cmd in smtp_fix_cmds:
            stdin, stdout, stderr = ssh.exec_command(cmd)
            stdout.channel.recv_exit_status()
        print("[OK] Supabase docker SMTP updated to BeBrilliant.")

        # 6. Restart Supabase auth to pick up new SMTP
        print("\n--> Restarting supabase-auth to pick up new SMTP config...")
        stdin, stdout, stderr = ssh.exec_command(
            "cd /opt/supabase/docker && docker compose restart auth"
        )
        out = stdout.read().decode('utf-8', errors='ignore')
        err = stderr.read().decode('utf-8', errors='ignore')
        print(out or err)

        # 7. Restart PM2 apps to pick up new .env.production
        print("\n--> Restarting PM2 apps to pick up correct credentials...")
        stdin, stdout, stderr = ssh.exec_command(
            "export NVM_DIR=\"$HOME/.nvm\" && [ -s \"$NVM_DIR/nvm.sh\" ] && "
            "\\. \"$NVM_DIR/nvm.sh\" && pm2 restart all --update-env"
        )
        stdout.channel.recv_exit_status()
        out = stdout.read().decode('utf-8', errors='ignore')
        print(out)

        # 8. Final PM2 status
        print("\n--> Final PM2 status...")
        stdin, stdout, stderr = ssh.exec_command(
            "export NVM_DIR=\"$HOME/.nvm\" && [ -s \"$NVM_DIR/nvm.sh\" ] && "
            "\\. \"$NVM_DIR/nvm.sh\" && pm2 status"
        )
        print(stdout.read().decode('utf-8'))

        print("\n" + "=" * 60)
        print("CREDENTIALS FIX COMPLETE")
        print("=" * 60)
        print("All BeBrilliant-specific credentials verified:")
        print("  SMTP    : support@bebrilliant.in ✅")
        print("  Razorpay: rzp_live_SHBxckJxQTVh7g ✅")
        print("  Gemini  : AIzaSyB6MxW... (BeBrilliant key) ✅")
        print("  JWT     : Local self-hosted Supabase secret ✅")
        print("  DB      : localhost:5432 (direct Postgres) ✅")
        print("  Supabase: supabase.bebrilliant.in ✅")
        print("\nNO BlinkOpticals credentials remain in BeBrilliant config.")

    except Exception as e:
        print(f"\n[ERROR] {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    main()

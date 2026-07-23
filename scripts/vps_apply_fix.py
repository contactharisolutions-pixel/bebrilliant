import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

VPS_IP = "89.116.33.188"
VPS_USER = "root"
VPS_PASS = "Life@20242526"

# Correct credentials gathered from /opt/supabase/docker/.env
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzc2Mjc5Mzg1LCJleHAiOjIwOTE4NTUzODV9.G4SFZFxpzP1gUUm80Lai0zdBhw7Mao0YvrqZSY2kpn8"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NzYyNzkzODUsImV4cCI6MjA5MTg1NTM4NX0.OJ5sjaj5y84CIRhv883r6YvU_56A_ik2gc4cCpeOSvw"
JWT_SECRET = "b77be88af20ed376b75eac250acf1392f31049e1a7f81d712ff214350a867f6e"
POSTGRES_PASSWORD = "22f12516315f194e31ad7e84f85874526fe5c2e229bc5d0b"

env_content = f"""# BeBrilliant Production Environment
# Self-Hosted Supabase on VPS (NOT BlinkOpticals / NOT cloud Supabase)

# ─── Supabase (Self-Hosted on VPS) ───────────────────────────────────────────
SUPABASE_URL=http://localhost:8000
SUPABASE_ANON_KEY={ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY={SERVICE_ROLE_KEY}

# ─── Database (Direct PostgreSQL — port 5432 on host → supabase-db container) ─
DATABASE_URL=postgresql://postgres:{POSTGRES_PASSWORD}@localhost:5432/postgres

# ─── Next.js Public Supabase Keys (public HTTPS URL for browser access) ──────
NEXT_PUBLIC_SUPABASE_URL=https://bebrilliant.in/api/supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY={ANON_KEY}


# ─── Site URL ─────────────────────────────────────────────────────────────────
NEXT_PUBLIC_SITE_URL=https://bebrilliant.in

# ─── Razorpay (BeBrilliant live keys — NOT BlinkOpticals) ────────────────────
RAZORPAY_KEY_ID=rzp_live_SHBxckJxQTVh7g
RAZORPAY_KEY_SECRET=fE8u2LU9PADggjbRK8yih4ez
RAZORPAY_SECRET_KEY=fE8u2LU9PADggjbRK8yih4ez
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
JWT_SECRET={JWT_SECRET}

# ─── AI & External APIs (BeBrilliant Gemini key) ─────────────────────────────
GEMINI_API_KEY=AIzaSyB6MxW-dfjVgy-5RQDdcbTT5BPCc3Zko5s

# ─── Timezone ─────────────────────────────────────────────────────────────────
TZ=Asia/Kolkata
"""

sql_seed_content = """BEGIN;

-- 1. Ensure extension pgcrypto exists
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Insert tenants if not exists
INSERT INTO public.tenants (id, name, type, tenant_type, email, is_active)
VALUES ('11111111-0000-0000-0000-000000000001', 'Brilliant Academy', 'INSTITUTE', 'institute', 'admin@brilliantacademy.edu', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 3. Seed owner@brightboard.in in auth.users & public.user_profiles
DO $$
DECLARE
    v_owner_id UUID := 'b1111111-1111-1111-1111-111111111111';
    v_instance UUID;
BEGIN
    SELECT instance_id INTO v_instance FROM auth.users LIMIT 1;
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, aud, role, raw_app_meta_data, raw_user_meta_data)
    VALUES (v_owner_id, COALESCE(v_instance, '00000000-0000-0000-0000-000000000000'), 'owner@brightboard.in', crypt('Demo@123', gen_salt('bf')), NOW(), 'authenticated', 'authenticated', '{"provider": "email", "providers": ["email"]}'::jsonb, '{"role": "owner"}'::jsonb)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.user_profiles (id, email, role, is_active, is_first_login, first_name, last_name)
    VALUES (v_owner_id, 'owner@brightboard.in', 'owner', TRUE, FALSE, 'System', 'Owner')
    ON CONFLICT (id) DO UPDATE SET role = 'owner', is_active = TRUE, is_first_login = FALSE;
END $$;

-- 4. Seed admin@bebrilliant.com in auth.users & public.user_profiles (as owner/system admin)
DO $$
DECLARE
    v_admin_id UUID := 'b2222222-2222-2222-2222-222222222222';
    v_instance UUID;
BEGIN
    SELECT instance_id INTO v_instance FROM auth.users LIMIT 1;
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, aud, role, raw_app_meta_data, raw_user_meta_data)
    VALUES (v_admin_id, COALESCE(v_instance, '00000000-0000-0000-0000-000000000000'), 'admin@bebrilliant.com', crypt('Demo@123', gen_salt('bf')), NOW(), 'authenticated', 'authenticated', '{"provider": "email", "providers": ["email"]}'::jsonb, '{"role": "owner"}'::jsonb)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.user_profiles (id, email, role, is_active, is_first_login, first_name, last_name)
    VALUES (v_admin_id, 'admin@bebrilliant.com', 'owner', TRUE, FALSE, 'Platform', 'Admin')
    ON CONFLICT (id) DO UPDATE SET role = 'owner', is_active = TRUE, is_first_login = FALSE;
END $$;

-- 5. Seed admin@brilliantacademy.edu in auth.users & public.user_profiles
DO $$
DECLARE
    v_academy_id UUID := 'b3333333-3333-3333-3333-333333333333';
    v_instance UUID;
BEGIN
    SELECT instance_id INTO v_instance FROM auth.users LIMIT 1;
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, aud, role, raw_app_meta_data, raw_user_meta_data)
    VALUES (v_academy_id, COALESCE(v_instance, '00000000-0000-0000-0000-000000000000'), 'admin@brilliantacademy.edu', crypt('Demo@123', gen_salt('bf')), NOW(), 'authenticated', 'authenticated', '{"provider": "email", "providers": ["email"]}'::jsonb, '{"role": "tenant_admin"}'::jsonb)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.user_profiles (id, email, role, tenant_id, is_active, is_first_login, first_name, last_name)
    VALUES (v_academy_id, 'admin@brilliantacademy.edu', 'tenant_admin', '11111111-0000-0000-0000-000000000001', TRUE, FALSE, 'Academy', 'Admin')
    ON CONFLICT (id) DO UPDATE SET role = 'tenant_admin', tenant_id = '11111111-0000-0000-0000-000000000001', is_active = TRUE, is_first_login = FALSE;
END $$;

-- 6. Reload schema
NOTIFY pgrst, 'reload schema';

COMMIT;
"""

def run_cmd(ssh, cmd):
    print(f"\n=========================================\nExecuting: {cmd}\n=========================================")
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

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(VPS_IP, username=VPS_USER, password=VPS_PASS, timeout=30)
        print("[OK] Connected to Hostinger VPS.")
        sftp = ssh.open_sftp()
        
        # 1. Write .env.production to /var/www/bebrilliant
        print("Writing .env.production on VPS...")
        with sftp.file('/var/www/bebrilliant/.env.production', 'w') as f:
            f.write(env_content)
        print("[OK] .env.production written.")
        
        # 2. Write seed.sql to /tmp
        print("Writing seed.sql on VPS...")
        with sftp.file('/tmp/seed.sql', 'w') as f:
            f.write(sql_seed_content)
        print("[OK] seed.sql written.")
        
        # 3. Apply seed.sql to supabase-db (properly pipe SQL content)
        print("Applying SQL seed script to postgres...")
        run_cmd(ssh, "docker exec -i supabase-db psql -U postgres -d postgres < /tmp/seed.sql")
        
        # 4. Rebuild Next.js app
        print("Rebuilding Next.js app (this may take a minute)...")
        build_cmd = "export NVM_DIR=\"$HOME/.nvm\" && [ -s \"$NVM_DIR/nvm.sh\" ] && \\. \"$NVM_DIR/nvm.sh\" && cd /var/www/bebrilliant && npm run build"
        run_cmd(ssh, build_cmd)
        
        # 5. Restart Next.js app in PM2
        print("Restarting PM2 application...")
        restart_cmd = "export NVM_DIR=\"$HOME/.nvm\" && [ -s \"$NVM_DIR/nvm.sh\" ] && \\. \"$NVM_DIR/nvm.sh\" && pm2 restart bebrilliant-next --update-env"
        run_cmd(ssh, restart_cmd)
        
        # 6. Verify users list
        print("Verifying users in the database...")
        run_cmd(ssh, "docker exec supabase-db psql -U postgres -d postgres -c \"SELECT id, email, role FROM auth.users;\"")
        run_cmd(ssh, "docker exec supabase-db psql -U postgres -d postgres -c \"SELECT id, email, role, is_active FROM public.user_profiles;\"")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    main()

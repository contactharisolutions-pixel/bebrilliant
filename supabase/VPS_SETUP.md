# Supabase VPS Self-Hosting Setup Guide

This guide details how to install, configure, and secure the self-hosted **Supabase Docker stack** on your Hostinger VPS.

---

## Step 1: Clone and Configure Supabase

1. SSH into your VPS as `root`.
2. Clone the Supabase repository containing the official Docker configuration:
   ```bash
   git clone --depth 1 https://github.com/supabase/supabase.git /opt/supabase
   cd /opt/supabase/docker
   ```
3. Copy the template configuration files:
   ```bash
   cp .env.example .env
   ```

---

## Step 2: Generate Secure JWT & API Credentials

To prevent unauthorized database access, generate secure JWT keys. You can run these commands on your local system or the VPS:

1. **Generate JWT Secret**:
   ```bash
   openssl rand -hex 32
   ```
   *Example Output:* `9af12c98a3b845d6a2f7e412...`
   
2. **Generate Anon Key & Service Role Key**:
   To generate compatible Supabase JWT tokens, visit [Supabase JWT Generator Tool (jwt.io)](https://jwt.io) or use a JWT signing tool. The payloads must match:
   
   - **Anon Key Payload**:
     ```json
     {
       "role": "anon",
       "iss": "supabase",
       "iat": 1776279385,
       "exp": 2091855385
     }
     ```
   - **Service Role Key Payload** (God mode - bypasses RLS):
     ```json
     {
       "role": "service_role",
       "iss": "supabase",
       "iat": 1776279385,
       "exp": 2091855385
     }
     ```
   
   Sign both payloads using the **JWT Secret** generated in step 2.1.

3. **Populate `/opt/supabase/docker/.env`**:
   Update the following keys in your `.env` file:
   ```env
   POSTGRES_PASSWORD=your_super_secure_postgres_db_password
   JWT_SECRET=your_openssl_generated_jwt_secret
   ANON_KEY=your_signed_anon_jwt_key
   SERVICE_ROLE_KEY=your_signed_service_role_jwt_key
   ```

---

## Step 3: Configure Hostinger SMTP for Auth Emails

To allow the self-hosted GoTrue Auth container to send verification emails, configure Hostinger SMTP inside `/opt/supabase/docker/.env`:

```env
SMTP_ADMIN_EMAIL=contact@blinkopticals.com
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=contact@blinkopticals.com
SMTP_PASS=Blink@2026
SMTP_SENDER_NAME=BeBrilliant
ENABLE_EMAIL_SIGNUP=true
ENABLE_EMAIL_CONFIRMATIONS=false  # Set to true to require email confirmation
```

---

## Step 4: Expose Ports & Start the Services

1. Open `/opt/supabase/docker/docker-compose.yml`.
2. Locate the `kong` (API Gateway) port bindings:
   ```yaml
   ports:
     - ${KONG_HTTP_PORT}:8000
   ```
   Ensure `KONG_HTTP_PORT` is set to `8000` in `.env`.
3. Locate the `studio` (Supabase Web UI Dashboard) bindings:
   ```yaml
   ports:
     - ${STUDIO_PORT}:8001
   ```
   Ensure `STUDIO_PORT` is set to `8001` in `.env`.
4. Run Docker Compose to boot the entire stack:
   ```bash
   docker compose up -d
   ```
5. Check status to ensure all 8+ containers (kong, go-true, postgrest, db, studio, storage, realtime, meta) are running:
   ```bash
   docker compose ps
   ```

---

## Step 5: Configure storage upload limit

By default, self-hosted storage might restrict large files (like OMR sheets or videos). To increase upload boundaries:
1. Edit `/opt/supabase/docker/.env`.
2. Ensure you have the following line:
   ```env
   STORAGE_FILE_SIZE_LIMIT_MB=100
   ```
3. Restart storage:
   ```bash
   docker compose restart storage
   ```

---

## Step 6: Map to Hostinger Nginx Reverse Proxy

Create an Nginx server block mapped to `supabase.bebrilliant.in` that redirects `/studio` to port `8001` and other routing requests to the API Gateway on port `8000` (refer to [bebrilliant.conf](file:///d:/MyProjects/BeBrilliant/nginx/bebrilliant.conf) template for setup).

# BeBrilliant Deployment Guide (Local ➔ Git ➔ Hostinger VPS)

This guide documents the production deployment architecture, configuration, and workflows for **BeBrilliant**.

---

## 1. Architecture Overview

```
 [ Local Workspace ]
         │
         │ 1. git commit & git push origin main
         ▼
 [ GitHub Repository ]
 (https://github.com/contactharisolutions-pixel/bebrilliant.git)
         │
         ├─────────────────────────────────────────┐
         │ (Automated GitHub Actions CI/CD)        │ (CLI Command Trigger)
         ▼                                         ▼
 [ .github/workflows/deploy.yml ]         [ python scripts/git_vps_deploy.py ]
         │                                         │
         └────────────────────┬────────────────────┘
                              │ SSH Connection (Port 22)
                              ▼
                [ Hostinger VPS (89.116.33.188) ]
                Directory: /var/www/bebrilliant
                ├─ 1. Git pull latest main branch
                ├─ 2. npm install
                ├─ 3. npm run build (Next.js compilation)
                ├─ 4. pm2 reload ecosystem.config.js --update-env
                └─ 5. Nginx config validation & reload
```

---

## 2. Server & Infrastructure Specifications

| Attribute | Details |
| :--- | :--- |
| **Server Host** | Hostinger VPS (`89.116.33.188`) |
| **User / Auth** | `root` (SSH Key or Secret Password) |
| **Deployment Root** | `/var/www/bebrilliant` |
| **Next.js App Port** | `3010` (Proxied via Nginx for `bebrilliant.in`) |
| **Express Server Port** | `5175` (Proxied via Nginx for `shop.bebrilliant.in`) |
| **Supabase Studio** | Port `8001` (Proxied via `supabase.bebrilliant.in/studio`) |
| **Supabase Gateway** | Port `8000` (Proxied via `supabase.bebrilliant.in/`) |
| **Process Manager** | PM2 (`bebrilliant-next` & `bebrilliant-express`) |

---

## 3. Deployment Methods

### Option A: Local CLI One-Command Deploy (Recommended for Developers)

To commit local changes, push to GitHub, and deploy to Hostinger VPS in a single step:

```bash
python scripts/git_vps_deploy.py
```

**What this does automatically:**
1. Checks local git status and prompts for commit message if needed.
2. Pushes `main` branch to remote origin `https://github.com/contactharisolutions-pixel/bebrilliant.git`.
3. Connects via SSH to Hostinger VPS (`89.116.33.188`).
4. Runs `scripts/vps-git-deploy.sh` on the VPS to pull, build, reload PM2, and verify health.

---

### Option B: Automated GitHub Actions CI/CD Pipeline

Every time code is pushed to the `main` branch on GitHub, GitHub Actions triggers `.github/workflows/deploy.yml`.

#### GitHub Repository Secrets Setup:
Configure the following secrets in GitHub Repository Settings (`Settings -> Secrets and variables -> Actions`):

* `VPS_HOST`: `89.116.33.188`
* `VPS_USERNAME`: `root`
* `VPS_PASSWORD`: `<your-vps-password>` (or `VPS_SSH_KEY` for key-based authentication)

---

### Option C: Manual SSH Deployment directly on VPS

SSH into the Hostinger VPS and execute the deployment script:

```bash
ssh root@89.116.33.188
cd /var/www/bebrilliant
bash scripts/vps-git-deploy.sh
```

---

## 4. Key Deployment Files & Configurations

* **`ecosystem.config.js`**: Defines PM2 applications (`bebrilliant-next` on port 3010 and `bebrilliant-express` on port 5175).
* **`nginx/bebrilliant.conf`**: Defines reverse proxy routes for `bebrilliant.in`, `shop.bebrilliant.in`, and `supabase.bebrilliant.in`.
* **`scripts/vps-git-deploy.sh`**: Standalone shell script executed on the VPS for git pull, npm install, build, PM2 zero-downtime reload, and health check.
* **`scripts/git_vps_deploy.py`**: Python script for local command-line deployment.
* **`.github/workflows/deploy.yml`**: GitHub Actions automated pipeline definition.
* **`.env.production.example`**: Reference schema for environment variables on the VPS (`/var/www/bebrilliant/.env`).

---

## 5. PM2 & Nginx Operational Commands

### PM2 Process Monitoring:
```bash
# Check application status
pm2 status

# View live logs
pm2 logs bebrilliant-next
pm2 logs bebrilliant-express

# Zero-downtime reload
pm2 reload ecosystem.config.js --update-env
```

### Nginx Server Operations:
```bash
# Test configuration syntax
nginx -t

# Reload configuration without dropping connections
systemctl reload nginx

# Check status
systemctl status nginx
```

---

## 6. Health Checks & Verification

After deployment, verify that services are healthy:

```bash
curl -I http://127.0.0.1:3010
curl -I http://127.0.0.1:5175
```

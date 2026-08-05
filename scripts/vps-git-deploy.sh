#!/usr/bin/env bash
set -e

# ==============================================================================
# BeBrilliant VPS Git Deployment Script
# Target Server: Hostinger VPS (89.116.33.188)
# Target Location: /var/www/bebrilliant
# ==============================================================================

echo "======================================================================"
echo "          Starting BeBrilliant Git Deployment on Hostinger VPS        "
echo "======================================================================"

APP_DIR="/var/www/bebrilliant"
REPO_URL="https://github.com/contactharisolutions-pixel/bebrilliant.git"
BRANCH="main"

# 1. Ensure Target Directory & Git Repo
if [ ! -d "$APP_DIR" ]; then
    echo "[+] Creating application directory: $APP_DIR"
    mkdir -p "$APP_DIR"
    echo "[+] Cloning repository from GitHub ($BRANCH branch)..."
    git clone -b "$BRANCH" "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"

# 2. Sync Git Repo
echo "[+] Fetching latest updates from GitHub..."
git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"
git clean -fd -e .env -e .env.production -e node_modules

# 3. Load Node.js & NVM Environment
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
    \. "$NVM_DIR/nvm.sh"
fi

if ! command -v node &> /dev/null; then
    echo "[!] Node.js not found in PATH. Installing Node.js 20..."
    nvm install 20
    nvm use 20
fi

echo "[+] Node version: $(node -v)"
echo "[+] NPM version:  $(npm -v)"

# 4. Environment File Check
if [ ! -f "$APP_DIR/.env" ] && [ -f "$APP_DIR/.env.production" ]; then
    echo "[+] Copying .env.production to .env..."
    cp "$APP_DIR/.env.production" "$APP_DIR/.env"
fi

# 5. Install Dependencies
echo "[+] Installing Node dependencies..."
npm install

# 6. Build Next.js Application
echo "[+] Building Next.js production build..."
npm run build

# 7. Reload PM2 Applications
echo "[+] Reloading PM2 applications with zero-downtime..."
if command -v pm2 &> /dev/null; then
    pm2 reload ecosystem.config.js --update-env || pm2 start ecosystem.config.js
else
    echo "[!] PM2 not found globally. Installing PM2..."
    npm install -g pm2
    pm2 start ecosystem.config.js
fi

# Save PM2 state across server reboots
pm2 save

# 8. Reload Nginx Web Server
echo "[+] Verifying Nginx configuration & reloading..."
if command -v nginx &> /dev/null; then
    nginx -t && systemctl reload nginx
fi

# 9. Application Health Verification
echo "[+] Verifying local ports..."
sleep 3

NEXT_HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3010 || echo "000")
EXPRESS_HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5175 || echo "000")

echo "[+] Next.js App (Port 3010) HTTP status code: $NEXT_HTTP_CODE"
echo "[+] Express Backend (Port 5175) HTTP status code: $EXPRESS_HTTP_CODE"

if [ "$NEXT_HTTP_CODE" -ge 200 ] && [ "$NEXT_HTTP_CODE" -lt 400 ]; then
    echo "======================================================================"
    echo "       [SUCCESS] BeBrilliant deployed and verified on VPS!           "
    echo "======================================================================"
else
    echo "[WARNING] Next.js service returned non-200 code ($NEXT_HTTP_CODE). Check PM2 logs: pm2 logs"
fi

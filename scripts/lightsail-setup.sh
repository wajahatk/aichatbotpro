#!/bin/bash
# AI Chat Bot Pro — AWS Lightsail setup script
# Run once as root on a fresh Ubuntu 22.04 instance
# Usage: bash lightsail-setup.sh

set -e

APP_DIR="/opt/aichatbotpro"
REPO="https://github.com/wajahatk/aichatbotpro.git"
NODE_VERSION="20"

echo "=== 1. System packages ==="
apt-get update -y
apt-get install -y curl git nginx unzip build-essential

echo "=== 2. Node.js $NODE_VERSION ==="
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
apt-get install -y nodejs

echo "=== 3. pnpm ==="
npm install -g pnpm@9.4.0

echo "=== 4. PM2 (process manager) ==="
npm install -g pm2

echo "=== 5. PostgreSQL ==="
apt-get install -y postgresql postgresql-contrib
systemctl enable postgresql
systemctl start postgresql

# Create DB and user
sudo -u postgres psql <<SQL
CREATE USER aichatbot WITH PASSWORD 'VYuxTjehXenmT3pIIGpd09Vb';
CREATE DATABASE aichatbotpro OWNER aichatbot;
GRANT ALL PRIVILEGES ON DATABASE aichatbotpro TO aichatbot;
SQL

echo "=== 6. Clone repo ==="
mkdir -p "$APP_DIR"
git clone "$REPO" "$APP_DIR"
cd "$APP_DIR"

echo "=== 7. Create .env.production ==="
cat > "$APP_DIR/apps/builder/.env.production" <<'ENV'
# ---- Fill these in before running the app ----
DATABASE_URL=postgresql://aichatbot:CHANGE_ME_DB_PASS@localhost:5432/aichatbotpro
ENCRYPTION_SECRET=CHANGE_ME_32_CHARS_EXACTLY______
NEXTAUTH_URL=http://YOUR_LIGHTSAIL_IP_OR_DOMAIN
NEXT_PUBLIC_VIEWER_URL=http://YOUR_LIGHTSAIL_IP_OR_DOMAIN
ADMIN_EMAIL=you@example.com
NODE_OPTIONS=--no-node-snapshot
NEXT_TELEMETRY_DISABLED=1
NODE_ENV=production
ENV

echo ""
echo "=== ACTION REQUIRED: Edit .env.production ==="
echo "   nano $APP_DIR/apps/builder/.env.production"
echo "   Set DATABASE_URL password, ENCRYPTION_SECRET (32 chars), and your domain/IP."
echo ""
read -p "Press Enter after editing .env.production to continue..."

echo "=== 8. Install dependencies ==="
cd "$APP_DIR"
pnpm install --no-frozen-lockfile --ignore-scripts

echo "=== 9. Push DB schema ==="
cd "$APP_DIR/packages/prisma"
npx prisma db push --schema=postgresql/schema.prisma

echo "=== 10. Build embeds ==="
cd "$APP_DIR"
node scripts/build-embeds.cjs

echo "=== 11. Build builder app ==="
cd "$APP_DIR/apps/builder"
pnpm build

echo "=== 12. PM2 service ==="
cat > "$APP_DIR/ecosystem.config.js" <<'PM2'
module.exports = {
  apps: [{
    name: "aichatbotpro",
    cwd: "/opt/aichatbotpro/apps/builder",
    script: "node",
    args: "server.js",
    env: {
      PORT: 3000,
      NODE_ENV: "production",
    },
    env_file: "/opt/aichatbotpro/apps/builder/.env.production",
    restart_delay: 3000,
    max_restarts: 10,
  }],
};
PM2

cd "$APP_DIR"
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root | tail -1 | bash

echo "=== 13. Nginx reverse proxy ==="
cat > /etc/nginx/sites-available/aichatbotpro <<'NGINX'
server {
    listen 80;
    server_name _;

    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/aichatbotpro /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo ""
echo "========================================"
echo "  Setup complete!"
echo "  App running at http://$(curl -s ifconfig.me)"
echo ""
echo "  Login: visit /signin, enter your ADMIN_EMAIL,"
echo "  then check PM2 logs for the 6-digit code:"
echo "    pm2 logs aichatbotpro"
echo "========================================"

#!/usr/bin/env bash
set -e

echo "🚀 Deploying updates to production (app.filtec.in)..."

# 1. Push local changes to GitHub
git push origin main

# 2. SSH into VPS, pull latest code, rebuild, and reload PM2
echo "📥 Pulling latest code and rebuilding on VPS..."
ssh -o StrictHostKeyChecking=no root@200.234.33.86 'bash -s' << 'EOF'
  set -e
  cd /var/www/filtec-one
  git checkout -- package-lock.json || true
  git pull origin main
  npm install --production=false
  npx prisma generate
  npm run build
  pm2 reload filtec-one
  echo "✅ Application reloaded with zero downtime!"
EOF

echo "🎉 Deployment complete! Visit https://app.filtec.in"

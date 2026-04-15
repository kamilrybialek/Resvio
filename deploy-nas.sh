#!/usr/bin/env bash
# ── Applyarr → NAS deployment script ─────────────────────────────────────────
# Run this from your Mac terminal:  bash deploy-nas.sh
# Requirements: rsync, ssh, docker-compose on NAS
# ─────────────────────────────────────────────────────────────────────────────

NAS_HOST="truenas_admin@192.168.1.249"
NAS_PATH="/mnt/ssd/appdata/applyarr"
LOCAL_PATH="$(cd "$(dirname "$0")" && pwd)"

set -e

echo "▶ Syncing code to NAS..."
rsync -avz --progress \
  --exclude node_modules \
  --exclude .next \
  --exclude .git \
  --exclude '*.log' \
  "$LOCAL_PATH/" "$NAS_HOST:$NAS_PATH/"

echo ""
echo "▶ Creating .env on NAS (if not exists)..."
ssh "$NAS_HOST" "
  mkdir -p $NAS_PATH
  if [ ! -f $NAS_PATH/.env ]; then
    echo 'ANTHROPIC_API_KEY=' > $NAS_PATH/.env
    echo 'OPENAI_API_KEY='   >> $NAS_PATH/.env
    echo '.env created — remember to add API keys!'
  else
    echo '.env already exists, skipping'
  fi
"

echo ""
echo "▶ Building and starting container..."
ssh "$NAS_HOST" "
  cd $NAS_PATH
  docker compose down --remove-orphans 2>/dev/null || true
  docker compose up -d --build
  docker compose ps
"

echo ""
echo "✓ Deployed! Open: http://192.168.1.249:3000"
echo ""
echo "Monitor logs with:"
echo "  ssh $NAS_HOST 'docker compose -f $NAS_PATH/docker-compose.yml logs -f'"

#!/usr/bin/env bash
# ── Applyarr → NAS deployment ────────────────────────────────────────────────
# Run from your Mac terminal:  bash deploy-nas.sh
#
# What it does:
#   1. Syncs source code to NAS (rsync, excludes node_modules/.next)
#   2. Creates .env on NAS if missing
#   3. docker compose up -d --build  (rebuilds image, zero downtime restart)
#   4. Optionally starts Cloudflare tunnel
# ─────────────────────────────────────────────────────────────────────────────

NAS_HOST="truenas_admin@192.168.1.249"
NAS_PATH="/mnt/ssd/appdata/applyarr"
LOCAL_PATH="$(cd "$(dirname "$0")" && pwd)"
WITH_TUNNEL="${1:-}"   # pass "tunnel" as arg to also start cloudflared

set -e
echo "╔═══════════════════════════════════╗"
echo "║   Applyarr → NAS deployment       ║"
echo "╚═══════════════════════════════════╝"
echo ""

# ── 1. Sync code ──────────────────────────────────────────────────────────────
echo "▶ [1/3] Syncing code to NAS..."
rsync -az --progress \
  --exclude node_modules \
  --exclude .next \
  --exclude .git \
  --exclude '*.log' \
  --exclude 'data/profile.json' \
  "$LOCAL_PATH/" "$NAS_HOST:$NAS_PATH/"
echo "   ✓ Sync done"

# ── 2. Create .env if missing ─────────────────────────────────────────────────
echo ""
echo "▶ [2/3] Checking .env on NAS..."
ssh "$NAS_HOST" bash <<REMOTE
  set -e
  mkdir -p "$NAS_PATH"
  if [ ! -f "$NAS_PATH/.env" ]; then
    cp "$NAS_PATH/.env.example" "$NAS_PATH/.env" 2>/dev/null || true
    echo "   ✗ .env created from template — please add API keys!"
    echo "   Edit: ssh $NAS_HOST 'nano $NAS_PATH/.env'"
  else
    echo "   ✓ .env exists"
  fi
REMOTE

# ── 3. Build & start ──────────────────────────────────────────────────────────
echo ""
echo "▶ [3/3] Building and starting containers..."

if [ "$WITH_TUNNEL" = "tunnel" ]; then
  echo "   (including Cloudflare tunnel)"
  ssh "$NAS_HOST" bash <<REMOTE
    cd "$NAS_PATH"
    COMPOSE_PROFILES=tunnel docker compose up -d --build --remove-orphans
    docker compose ps
REMOTE
else
  ssh "$NAS_HOST" bash <<REMOTE
    cd "$NAS_PATH"
    docker compose up -d --build --remove-orphans
    docker compose ps
REMOTE
fi

echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║  ✓ Deployed!                                          ║"
echo "║                                                       ║"
echo "║  LAN:    http://192.168.1.249:3000                    ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""
echo "Logs:    ssh $NAS_HOST 'docker logs applyarr -f'"
echo "Tunnel:  bash deploy-nas.sh tunnel"

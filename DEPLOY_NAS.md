# Deploying Resvio on TrueNAS SCALE

This guide walks through running Resvio as a persistent Docker container on
TrueNAS SCALE, including LinkedIn/Indeed scraping via Playwright and a
persistent profile database.

---

## Prerequisites

- TrueNAS SCALE 23.10 (Cobia) or newer
- A dataset on your pool for the app files, e.g. `tank/resvio`
- SSH access to the TrueNAS host (enable under **System > Services > SSH**)
- Docker Compose available — TrueNAS SCALE ships with `docker` via the
  built-in container runtime.  You can also install Portainer from the
  **Apps** catalogue for a GUI.
- At least one AI API key: `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`
- 2 GB+ free RAM (Chromium is memory-hungry)

---

## Option A — SSH + Docker Compose (recommended, no extra tooling)

### 1. Open a shell on TrueNAS

```bash
ssh admin@<your-nas-ip>
```

### 2. Clone the repository

```bash
# Adjust the path to wherever you store your app data
mkdir -p /mnt/tank/resvio
cd /mnt/tank/resvio
git clone https://github.com/<your-fork>/resvio.git .
```

If you do not have git on the NAS, you can `scp` or `rsync` the project
folder from your development machine instead:

```bash
# Run this from your dev machine, not the NAS
rsync -avz --exclude node_modules --exclude .next \
    /path/to/Resvio/ admin@<nas-ip>:/mnt/tank/resvio/
```

### 3. Create the environment file

```bash
cd /mnt/tank/resvio
cp .env.example .env.local 2>/dev/null || touch .env.local
nano .env.local
```

Minimum contents:

```env
OPENAI_API_KEY=sk-...
# and/or
ANTHROPIC_API_KEY=sk-ant-...
```

The `docker-compose.yml` reads these via shell variable substitution
(`${OPENAI_API_KEY:-}`), so they must be exported **or** placed in a `.env`
file alongside `docker-compose.yml`:

```bash
# Create the .env file that docker-compose picks up automatically
cat .env.local > .env
```

> **Never commit `.env` to git.**

### 4. Build and start the container

```bash
cd /mnt/tank/resvio
docker compose up -d --build
```

The first build takes 5-10 minutes while apt installs Chromium and npm
installs all packages.  Subsequent startups are fast.

### 5. Verify it is running

```bash
docker compose ps
docker compose logs -f resvio
```

Open `http://<your-nas-ip>:3000` in a browser on your local network.

---

## Option B — TrueNAS SCALE Apps (Portainer)

1. In the TrueNAS web UI go to **Apps > Available Applications** and install
   **Portainer CE**.
2. Open Portainer at `http://<nas-ip>:9000`.
3. Create a new **Stack** and paste the contents of `docker-compose.yml`.
4. Under **Environment variables** add `OPENAI_API_KEY` and/or
   `ANTHROPIC_API_KEY`.
5. Deploy the stack.  Portainer will build the image from the Dockerfile if
   you point it at the repository, or you can pre-build and push to a local
   registry.

> Tip: For the simplest path, use Option A via SSH and reserve Portainer for
> ongoing monitoring.

---

## Persistent Storage

The `docker-compose.yml` declares a named volume `resvio_data` which maps
to `/app/data` inside the container.  This is where `data/profile.json` (the
user profile / CV database) lives.

Docker stores named volumes under:

```
/var/lib/docker/volumes/resvio_resvio_data/
```

on TrueNAS SCALE.  To back it up:

```bash
docker run --rm \
  -v resvio_resvio_data:/data \
  -v /mnt/tank/backups:/backup \
  busybox tar czf /backup/resvio_data_$(date +%F).tar.gz /data
```

If you prefer to store the data on a specific TrueNAS dataset (e.g.
`tank/resvio/data`), replace the named volume in `docker-compose.yml` with
a bind mount:

```yaml
volumes:
  - /mnt/tank/resvio/data:/app/data
```

---

## Accessing the App on Your Local Network

Once the container is running, access Resvio at:

```
http://<your-nas-ip>:3000
```

The middleware password (set in `middleware.ts`) is: see `CLAUDE.md`.

---

## Optional: Local Domain with TrueNAS DNS Override

If you run a local DNS resolver (e.g. Pi-hole, AdGuard, or TrueNAS's own
**Local DNS** under **Network > Global Configuration**):

1. Add an A record: `resvio.local` → `<your-nas-ip>`
2. Access the app at `http://resvio.local:3000`

For port 80 without specifying a port, place a reverse proxy (e.g. **Nginx
Proxy Manager** from the Apps catalogue) in front of the container and
proxy `resvio.local` → `localhost:3000`.

---

## Playwright / LinkedIn / Indeed Scrapers

Resvio includes Playwright-based scrapers for LinkedIn and Indeed.  These
scrapers are **disabled on Vercel** (gated by `VERCEL !== '1'`) but are
**fully active inside the Docker container** because `VERCEL` is not set.

Chromium is installed at the system level (`/usr/bin/chromium`) inside the
image and pointed to via `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.  The
`shm_size: '256m'` entry in `docker-compose.yml` is required — without it
Chromium will crash with a shared-memory error.

If scraping stops working, increase `shm_size` to `'512m'` and rebuild.

---

## Updating the App

```bash
cd /mnt/tank/resvio

# Pull latest code
git pull

# Rebuild the image and restart the container
# (the resvio_data volume is preserved automatically)
docker compose up -d --build
```

To also prune old/dangling images after an update:

```bash
docker image prune -f
```

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Container exits immediately | `docker compose logs resvio` — likely a missing API key or build error |
| Chromium crashes / blank scraper results | Increase `shm_size` to `512m` in `docker-compose.yml` |
| Port 3000 already in use | Change the host port: `"3001:3000"` in `docker-compose.yml` |
| `data/profile.json` lost after update | Check that you are using the named volume, not a bind mount to `.next/` |
| Slow first build | Normal — apt + npm install inside the image takes several minutes |

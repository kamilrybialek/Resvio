# Subdomain Setup — resvio.online

This document explains the full DNS, Vercel, and Cloudflare Tunnel configuration
required to serve Resvio under the `resvio.online` domain.

---

## Architecture overview

| Subdomain | Destination | How |
|---|---|---|
| `resvio.online` | Vercel (Next.js landing page) | CNAME → Vercel, grey cloud |
| `app.resvio.online` | NAS (full Next.js app) | Cloudflare Tunnel, orange cloud |

---

## 1. DNS records (Cloudflare dashboard)

Log in to Cloudflare → select the `resvio.online` zone → **DNS → Records**.

### 1a. resvio.online → Vercel

| Field | Value |
|---|---|
| Type | CNAME |
| Name | `@` |
| Target / Value | `cname.vercel-dns.com` |
| Proxy status | **DNS only** (grey cloud) |
| TTL | Auto |

> **Why grey cloud?** Vercel manages its own SSL certificate via ACME/Let's Encrypt
> and requires direct DNS resolution to verify domain ownership.  Proxying through
> Cloudflare would break that handshake.

### 1b. app.resvio.online → Cloudflare Tunnel (NAS)

This record is created automatically when you configure the tunnel Public Hostname
in step 3, but you can also add it manually:

| Field | Value |
|---|---|
| Type | CNAME |
| Name | `app` |
| Target / Value | `<tunnel-id>.cfargotunnel.com` |
| Proxy status | **Proxied** (orange cloud) |
| TTL | Auto |

---

## 2. Vercel custom domain

1. Open [vercel.com](https://vercel.com) → **resvio** project → **Settings → Domains**.
2. Click **Add** and enter `resvio.online`.
3. Vercel will show the expected CNAME value (`cname.vercel-dns.com`) — this matches
   what you added in step 1a.
4. Click **Verify** (or wait ~60 s for automatic propagation check).
5. SSL is provisioned automatically once DNS resolves.

> The middleware in `middleware.ts` rewrites every request arriving on
> `resvio.online` to the `/landing` route, so no auth wall is shown to
> public visitors.

---

## 3. Cloudflare Tunnel — app.resvio.online → NAS

### 3a. Create the tunnel

1. Cloudflare dashboard → **Zero Trust** → **Networks → Tunnels**.
2. Click **Create a tunnel** → name it `resvio-nas` → **Save tunnel**.
3. Choose **Docker** as the connector type.
4. Copy the tunnel token shown on screen (starts with `eyJ…`).

### 3b. Add the token to your NAS

Add the token to the NAS `.env` file (same directory as `docker-compose.yml`):

```env
CLOUDFLARE_TUNNEL_TOKEN=eyJ...   # paste the full token here
```

### 3c. Start the tunnel container on the NAS

```bash
docker compose --profile tunnel up -d
```

Your `docker-compose.yml` should contain a service similar to:

```yaml
services:
  cloudflared:
    image: cloudflare/cloudflared:latest
    restart: unless-stopped
    command: tunnel --no-autoupdate run
    environment:
      - TUNNEL_TOKEN=${CLOUDFLARE_TUNNEL_TOKEN}
    profiles:
      - tunnel
```

### 3d. Add the Public Hostname in Zero Trust

Back in the Cloudflare dashboard (Zero Trust → Networks → Tunnels → `resvio-nas`
→ **Public Hostnames** → **Add a public hostname**):

| Field | Value |
|---|---|
| Subdomain | `app` |
| Domain | `resvio.online` |
| Service type | HTTP |
| URL | `resvio:3000` |

> `resvio` is the Docker service / container name on the NAS.  If your container
> is on a different host replace with its LAN IP, e.g. `192.168.1.50:3000`.

Cloudflare will automatically create or update the DNS CNAME record for
`app.resvio.online`.

---

## 4. Smoke tests

Once DNS has propagated (usually < 5 minutes with Cloudflare):

```bash
# Should show the public landing page — no auth prompt
curl -I https://resvio.online

# Should show the full app served from the NAS
curl -I https://app.resvio.online
```

Expected results:

| URL | Expected response |
|---|---|
| `https://resvio.online` | `200 OK` — landing page, no auth wall |
| `https://app.resvio.online` | `200 OK` — full Resvio app (NAS) |
| `https://resvio-<id>.vercel.app` | `401` unless Basic Auth password is supplied |

---

## 5. Notes & gotchas

- **SSL on Vercel domain**: Vercel auto-provisions a certificate for
  `resvio.online` within a few minutes of DNS propagation. No manual
  action needed.
- **Cloudflare Tunnel SSL**: Cloudflare issues a certificate for
  `app.resvio.online` automatically. Traffic between the tunnel
  daemon and Cloudflare edge is always encrypted.
- **Middleware guard**: `middleware.ts` includes an explicit guard for
  `app.resvio.online` even though Vercel never serves that hostname in
  production. This is intentional — it protects against misconfiguration.
- **Basic auth on Vercel previews**: All `resvio-*.vercel.app` deployments and
  `localhost` remain behind Basic Auth (password: see `CLAUDE.md`).

# ── Applyarr Dockerfile ───────────────────────────────────────────────────────
# Single-stage build on Debian Bookworm slim so that glibc is available for
# Playwright/Chromium.  Alpine is intentionally avoided here because Playwright
# requires glibc.
# ──────────────────────────────────────────────────────────────────────────────

FROM node:22-bookworm-slim

# ── System dependencies for Chromium ─────────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    chromium-sandbox \
    fonts-liberation \
    fonts-noto-color-emoji \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# ── App setup ─────────────────────────────────────────────────────────────────
WORKDIR /app

# Tell Playwright to use the system-installed Chromium instead of downloading
# its own binary.
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium
# Skip Playwright's own browser download (we use system chromium above).
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
# Disable Next.js telemetry.
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Install dependencies first (better layer caching).
COPY package*.json ./
RUN npm ci

# Copy source.
# Note: "CV template" directory (with the space) is included intentionally —
# it contains CV layout images used at runtime.
COPY . .

# Build the Next.js application.
RUN npm run build

# ── Runtime ───────────────────────────────────────────────────────────────────
EXPOSE 3000

CMD ["npm", "start"]

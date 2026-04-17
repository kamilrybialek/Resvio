import type { NextConfig } from "next";
import { execSync } from "child_process";

let gitHash = 'unknown';
try {
  gitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
} catch {}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || '0.5.0',
    NEXT_PUBLIC_GIT_HASH:    gitHash,
    NEXT_PUBLIC_BUILD_DATE:  new Date().toISOString().split('T')[0],
  },
};

export default nextConfig;

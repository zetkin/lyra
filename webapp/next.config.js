const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * Block cross-origin requests during development.
   *
   * Without this, when running next dev, malicious website can:
   * - Initiate a WebSocket connection to localhost and interact
   *   with the local development server, potentially exposing
   *   internal component code.
   * - Inject a <script> tag referencing predictable paths for
   *   development scripts (e.g., /app/page.js), which are then
   *   executed in the attacker's origin.
   *
   * See https://vercel.com/changelog/cve-2025-48068
   */
  allowedDevOrigins: [],

  output: 'standalone',

  // 👇 make tracing start at the monorepo root
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '..'),
  },
};

module.exports = nextConfig;

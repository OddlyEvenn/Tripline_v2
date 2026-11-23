'use strict';

/**
 * Tripline Lightweight Keep-Alive Service
 *
 * Keeps Render Free Tier & Database connections active without unnecessary CPU load:
 * - Render free tier sleeps after 15 minutes of inactivity.
 * - This service triggers every 14 minutes (only ~4 times per hour).
 * - Issues a sub-millisecond HTTP GET /health to reset the idle countdown.
 * - Runs a lightweight `SELECT 1 FROM DUAL` to keep the DB connection pool active.
 */

const https = require('https');
const http = require('http');
const { getConnection } = require('../config/db');

// 14 minutes in milliseconds (Render sleep threshold is 15 minutes)
const INTERVAL_MS = 14 * 60 * 1000;

function startKeepAlive() {
  const targetUrl = process.env.RENDER_EXTERNAL_URL || process.env.BACKEND_URL || process.env.KEEP_ALIVE_URL;

  console.log('[KeepAlive] Mechanism initialized (Interval: 14 mins).');

  setInterval(async () => {
    // 1. HTTP Self-Ping to prevent Render free-tier sleep
    if (targetUrl) {
      try {
        const pingUrl = targetUrl.replace(/\/+$/, '') + '/health';
        const client = pingUrl.startsWith('https') ? https : http;

        client.get(pingUrl, (res) => {
          res.resume(); // Free memory immediately
          if (res.statusCode === 200) {
            console.log(`[KeepAlive] HTTP ping successful: ${pingUrl}`);
          }
        }).on('error', (err) => {
          console.warn('[KeepAlive] HTTP ping notice:', err.message);
        });
      } catch (err) {
        console.warn('[KeepAlive] HTTP ping failed:', err.message);
      }
    }

    // 2. Database heartbeat to prevent idle connection drop / sleeping
    try {
      const conn = await getConnection();
      await conn.execute('SELECT 1 FROM DUAL');
      await conn.close();
      console.log('[KeepAlive] DB heartbeat ping successful.');
    } catch (err) {
      // Don't crash if DB is momentarily unreachable
      console.warn('[KeepAlive] DB heartbeat notice:', err.message);
    }
  }, INTERVAL_MS);
}

module.exports = { startKeepAlive };

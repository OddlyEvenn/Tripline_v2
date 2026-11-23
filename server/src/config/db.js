'use strict';

/**
 * Tripline Database Adapter
 * Powered by PostgreSQL (NeonDB) with full drop-in compatibility for existing Oracle query patterns.
 */

const { Pool } = require('pg');

let pool = null;

function buildPostgresQuery(sql, binds) {
  let translatedSql = sql;
  const values = [];

  // 1. Transform Oracle spatial constructs
  translatedSql = translatedSql.replace(
    /CASE\s+WHEN\s+s\.location\s+IS\s+NOT\s+NULL\s+THEN\s+s\.location\.sdo_point\.y\s+ELSE\s+NULL\s+END\s+AS\s+latitude/gi,
    's.latitude AS latitude'
  ).replace(
    /CASE\s+WHEN\s+s\.location\s+IS\s+NOT\s+NULL\s+THEN\s+s\.location\.sdo_point\.x\s+ELSE\s+NULL\s+END\s+AS\s+longitude/gi,
    's.longitude AS longitude'
  );

  // In stations insert:
  if (/INSERT\s+INTO\s+stations/i.test(translatedSql) && /MDSYS\.SDO_GEOMETRY/i.test(translatedSql)) {
    translatedSql = translatedSql.replace(/location/gi, 'latitude, longitude');
    translatedSql = translatedSql.replace(/MDSYS\.SDO_GEOMETRY\([^)]+\)/gi, ':lat, :lon');
  }

  // 2. Transform RETURNING ... INTO :id -> RETURNING id AS id
  let hasReturning = false;
  let returningVar = null;
  const returningMatch = translatedSql.match(/RETURNING\s+(\w+)\s+INTO\s+:(\w+)/i);
  if (returningMatch) {
    hasReturning = true;
    returningVar = returningMatch[2];
    translatedSql = translatedSql.replace(/RETURNING\s+(\w+)\s+INTO\s+:(\w+)/i, 'RETURNING $1 AS id');
  }

  // 3. Transform Oracle bind variables (:name or :1) to Postgres ($1, $2, etc.)
  if (Array.isArray(binds)) {
    // Array binds: e.g. [name, city] or for :1, :2
    translatedSql = translatedSql.replace(/:(\d+)/g, (m, num) => `$${num}`);
    if (!/:\d+/.test(sql) && /:([a-zA-Z_]\w*)/.test(translatedSql)) {
      let idx = 0;
      translatedSql = translatedSql.replace(/:([a-zA-Z_]\w*)/g, () => `$${++idx}`);
    }
    values.push(...binds);
  } else if (binds && typeof binds === 'object') {
    let paramIndex = 1;
    translatedSql = translatedSql.replace(/:([a-zA-Z_]\w*)/g, (match, key) => {
      if (hasReturning && key === returningVar) {
        return '';
      }
      if (key in binds) {
        values.push(binds[key]);
        return `$${paramIndex++}`;
      }
      return match;
    });
  }

  return { sql: translatedSql, values, hasReturning };
}

function normalizeRows(rows) {
  if (!rows || !Array.isArray(rows)) return [];
  return rows.map(row => {
    const norm = { ...row };
    for (const [k, v] of Object.entries(row)) {
      norm[k.toUpperCase()] = v;
      norm[k.toLowerCase()] = v;
    }
    return norm;
  });
}

/**
 * Initializes the Neon PostgreSQL pool
 */
async function initDb() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('FATAL: DATABASE_URL is not set in environment.');
    process.exit(1);
  }

  try {
    pool = new Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    });

    const client = await pool.connect();
    console.log('PostgreSQL (NeonDB) connection pool created and verified successfully.');
    client.release();
  } catch (err) {
    console.error('Failed to connect to PostgreSQL (NeonDB):', err.message);
    process.exit(1);
  }
}

/**
 * Returns a connection client with Oracle-compatible API
 */
async function getConnection() {
  if (!pool) {
    throw new Error('Database pool not initialized. Call initDb() first.');
  }

  const client = await pool.connect();
  let inTransaction = false;

  return {
    async execute(sql, binds = {}, options = {}) {
      const { sql: pSql, values, hasReturning } = buildPostgresQuery(sql, binds);
      const res = await client.query(pSql, values);
      const rows = normalizeRows(res.rows);
      const outBinds = {};

      if (hasReturning && rows.length > 0) {
        outBinds.id = [rows[0].id || rows[0].ID];
      }

      return {
        rows,
        outBinds,
        rowCount: res.rowCount
      };
    },

    async executeMany(sql, batch, options = {}) {
      if (!batch || batch.length === 0) return;

      const valuesMatch = sql.match(/VALUES\s*\(([^)]+)\)/i);
      if (valuesMatch) {
        const parts = valuesMatch[1].split(',').map(s => s.trim());
        const CHUNK = 200;

        for (let i = 0; i < batch.length; i += CHUNK) {
          const slice = batch.slice(i, i + CHUNK);
          const rowStrings = [];
          const flatParams = [];
          let paramIdx = 1;

          for (const row of slice) {
            let rowParamIdx = 0;
            const rowTokens = parts.map(token => {
              if (token.startsWith(':')) {
                flatParams.push(row[rowParamIdx++]);
                return `$${paramIdx++}`;
              }
              return token;
            });
            rowStrings.push(`(${rowTokens.join(', ')})`);
          }

          const multiRowSql = sql.replace(/VALUES\s*\([^)]+\)/i, `VALUES ${rowStrings.join(', ')}`);
          await client.query(multiRowSql, flatParams);
        }
      } else {
        const pSql = sql.replace(/:(\d+)/g, '$$$1');
        await client.query('BEGIN');
        try {
          for (const row of batch) {
            await client.query(pSql, row);
          }
          await client.query('COMMIT');
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        }
      }
    },

    async commit() {
      if (inTransaction) {
        await client.query('COMMIT');
        inTransaction = false;
      }
    },

    async rollback() {
      if (inTransaction) {
        await client.query('ROLLBACK');
        inTransaction = false;
      }
    },

    async close() {
      client.release();
    }
  };
}

async function closeDb() {
  if (pool) {
    await pool.end();
    console.log('PostgreSQL connection pool closed.');
  }
}

module.exports = {
  initDb,
  getConnection,
  closeDb
};

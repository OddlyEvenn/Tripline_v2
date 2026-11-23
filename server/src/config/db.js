const oracledb = require('oracledb');

// By default oracledb returns rows as arrays. We want objects.
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

// Fetch CLOB columns as strings automatically
oracledb.fetchAsString = [ oracledb.CLOB ];


const port = process.env.Port || '1521';
const protocol = process.env.PROTOCOL || (port === '2484' ? 'tcps' : 'tcp');
const connectString = process.env.CONNECT_STRING || (
  protocol === 'tcps'
    ? `tcps://${process.env.Hostname}:${port}/${process.env.Service_Name}`
    : `${process.env.Hostname}:${port}/${process.env.Service_Name}`
);

// Read DB credentials from environment variables
const dbConfig = {
  user: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  connectString
};

/**
 * Initializes the Oracle connection pool
 */
async function initDb() {
  try {
    await oracledb.createPool({
      ...dbConfig,
      poolMin: 2,
      poolMax: 10,
      poolIncrement: 1
    });
    console.log('Oracle Database connection pool created successfully.');
  } catch (err) {
    console.error('Failed to create Oracle Database pool:', err);
    process.exit(1);
  }
}

/**
 * Get a connection from the pool
 */
async function getConnection() {
  return await oracledb.getConnection();
}

/**
 * Close the pool gracefully
 */
async function closeDb() {
  try {
    await oracledb.getPool().close(10);
    console.log('Oracle Database connection pool closed.');
  } catch (err) {
    console.error('Error closing Oracle Database pool:', err);
  }
}

module.exports = {
  initDb,
  getConnection,
  closeDb
};

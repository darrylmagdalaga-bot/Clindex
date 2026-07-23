import mssql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  user: process.env.DB_USER || 'admincicto',
  password: process.env.DB_PASSWORD || 'P@ssw0rd2024',
  server: process.env.DB_SERVER || 'vtsdatabasen.database.windows.net',
  database: process.env.DB_NAME || 'ClindexDatabaseN',
  port: parseInt(process.env.DB_PORT || '1433', 10),
  options: {
    encrypt: process.env.DB_ENCRYPT !== 'false',
    trustServerCertificate: false,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let poolPromise = null;

export async function getDbPool() {
  if (!poolPromise) {
    poolPromise = mssql
      .connect(config)
      .then((pool) => {
        console.log('[Azure SQL] Connection Pool established successfully.');
        return pool;
      })
      .catch((err) => {
        console.error('[Azure SQL] Pool connection error:', err.message);
        poolPromise = null;
        throw err;
      });
  }
  return poolPromise;
}

export async function checkDbHealth() {
  try {
    const pool = await getDbPool();
    const result = await pool.request().query('SELECT 1 AS healthy');
    return result.recordset[0].healthy === 1;
  } catch (err) {
    return false;
  }
}

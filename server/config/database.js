const mysql = require('mysql');
const util = require('util');

let pool = null;

function createPool() {
  const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } = process.env;

  if (!DB_HOST || !DB_USER || !DB_NAME) {
    return null;
  }

  return mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD || '',
    database: DB_NAME,
    port: Number(DB_PORT || 3306),
    connectionLimit: 10,
  });
}

async function getDatabase() {
  if (pool) {
    return pool;
  }

  pool = createPool();

  if (!pool) {
    return null;
  }

  pool.query = util.promisify(pool.query).bind(pool);

  try {
    await pool.query('SELECT 1');
    return pool;
  } catch (error) {
    pool = null;
    return null;
  }
}

module.exports = { getDatabase };

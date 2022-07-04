const { Pool } = require('pg');
const { DATABASE_URL } = require('../config.js');

const pool = new Pool({
  connectionString: DATABASE_URL
});

pool.on('connect', () => {
  console.log('[db] client connected to database');
});

pool.on('remove', () => {
  console.log('[db] client removed from pool');
});

module.exports = {
  pool,
  async query(text, params) {
    try {
      const start = Date.now();
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      console.log('[db] executed query', { text, params, duration, rows: res.rowCount });
      return res;
    } catch (err) {
      throw err;
    }
  }
};

const { Pool } = require('pg');
const { DATABASE_URL, NODE_ENV } = require('../config.js');

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
  },
  async getClient() {
    const client = await pool.connect();
    if (!client) return null;
    console.log('[db] a client has been checked out');

    const query = client.query;
    const release = client.release;

    const timeout = setTimeout(() => {
      console.error('[db] a client has been checked out for 5 seconds');
      console.error('[db] last executed query', { query: client.lastQuery });
    }, 5000);

    client.query = (text, params) => {
      if (!params) params = [];
      client.lastQuery = { text, params };
      console.log('[db] executed query', { text, params });
      return query.apply(client, [text, params]);
    };

    client.release = () => {
      clearTimeout(timeout);
      client.query = query;
      client.release = release;
      console.log('[db] releasing client');
      return release.apply(client);
    };

    return client;
  }
};

const express = require('express');
const bodyParser = require('body-parser');

const mountRoutes = require('./routes/index.js');
const { pool } = require('./db/index.js');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const port = process.env.PORT || 3001;

mountRoutes(app);

app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({ error: err.message });
});

process.on('SIGINT', () => {
  pool.end(() => {
    console.log('[db] pool has ended');
  });
  console.log('[server] shutting down');
  process.exit();
});

app.listen(port, () => {
  console.log(`[server] listening on port ${port}`)
})

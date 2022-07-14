const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const passport = require('passport');
const bodyParser = require('body-parser');

const { SESSION_SECRET, PORT, NODE_ENV } = require('./config.js');
const mountRoutes = require('./routes/index.js');
const { pool } = require('./db/index.js');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: SESSION_SECRET,
    cookie: { maxAge: 900000, secure: false },
    rolling: true,
    saveUninitialized: false,
    resave: false,
    store: new pgSession({
      pool,
      tableName: 'session',
    }),
  })
);

app.use(passport.initialize());
app.use(passport.session());

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

if (NODE_ENV !== 'test') {
  const port = PORT || 3001;
  app.listen(port, () => {
    console.log(`[server] listening on port ${port}`)
  });
}

module.exports = app;

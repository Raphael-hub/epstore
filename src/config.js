const dotenv = require('dotenv').config();

module.exports = {
  DATABASE_URL: process.env.DATABASE_URL,
  SESSION_SECRET: process.env.SESSION_SECRET,
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT
};

const { query } = require('./index.js');

const getUserByUsername = async (username) => {
  try {
    const result = await query(
      'SELECT * FROM users WHERE username = $1', [username]
    );
    if (!result) {
      return null;
    }
    return result.rows[0];
  } catch (err) {
    throw err;
  }
};

const getUserByEmail = async (email) => {
  try {
    const result = await query(
      'SELECT * FROM users WHERE email = $1', [email]
    );
    if (!result) {
      return null;
    }
    return result.rows[0];
  } catch (err) {
    throw err;
  }
};

const createUser = async (user) => {
  try {
    const { username, password, email, name, address } = user;
    const date = new Date();
    const result = await query(
      'INSERT INTO users (username, password, email, name, address, created_at) \
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [username, password, email, name, address, date.toISOString()]
    );
    if (!result) {
      return null;
    }
    return result.rows[0];
  } catch (err) {
    throw err;
  }
};

const getUsers = async () => {
  try {
    const result = await query('SELECT * FROM users ORDER BY id ASC');
    if (!result) {
      return null;
    }
    return result.rows[0];
  } catch (err) {
    throw err;
  }
};

module.exports = {
  getUserByUsername,
  getUserByEmail,
  getUsers,
  createUser,
};

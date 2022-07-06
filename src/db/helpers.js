const { query } = require('./index.js');

const getUserById = async (id) => {
  try {
    const { rows } = await query(
      'SELECT * FROM users WHERE id = $1', [id]
    );
    return rows[0] || null;
  } catch (err) {
    throw err;
  }
};

const getUserByUsername = async (username) => {
  try {
    const { rows } = await query(
      'SELECT * FROM users WHERE username = $1', [username]
    );
    return rows[0] || null;
  } catch (err) {
    throw err;
  }
};

const getUserByEmail = async (email) => {
  try {
    const { rows } = await query(
      'SELECT * FROM users WHERE email = $1', [email]
    );
    return rows[0] || null;
  } catch (err) {
    throw err;
  }
};

const createUser = async (user) => {
  const { username, password, email, name, address } = user;
  const date = new Date();
  try {
    const { rows } = await query(
      'INSERT INTO users (username, password, email, name, address, created_at) \
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [username, password, email, name, address, date.toISOString()]
    );
    return rows[0] || null;
  } catch (err) {
    throw err;
  }
};

const updateUserById = async (id, updates) => {
  const { username, password, email, name, address } = updates;
  try {
    const result = await getUserById(id);
    if (!result) {
      throw new Error('User not found');
    }
    if (username !== result.username && await getUserByUsername(username)) {
      throw new Error('User with that username already exists');
    }
    if (email !== result.email && await getUserByEmail(email)) {
      throw new Error('User with that email already exists');
    }
    const { rows } = await query(
      'UPDATE users \
      SET (username, password, email, name, address) = ($1, $2, $3, $4, $5) \
      WHERE id = $6 RETURNING *',
      [username, password, email, name, address, id]
    );
    return rows[0] || null;
  } catch (err) {
    throw err;
  }
};

const deleteUserById = async (id) => {
  try {
    const { rows } = await query(
      'DELETE FROM users WHERE id = $1 RETURNING *',
      [id]
    );
    return rows[0] || null;
  } catch (err) {
    throw err;
  }
};

const getProductById = async (id) => {
  try {
    const { rows } = await query(
      'SELECT * FROM products WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  } catch (err) {
    throw err;
  }
};

const getProductsByKeyword = async (word, column = 'price', sort = 'asc') => {
  let queryString = 'SELECT * FROM products \
      WHERE name ILIKE $1 OR description ILIKE $1 \
      ORDER BY $2';
  if (sort.toLowerCase() === 'asc') queryString += ' ASC';
  if (sort.toLowerCase() === 'desc') queryString += ' DESC';
  try {
    const { rows } = await query(
      queryString,
      [`%${word.toLowerCase()}%`, column]
    );
    return rows || null;
  } catch (err) {
    throw err;
  }
};

const getProductsByUser = async (username) => {
  try {
    const result = await getUserByUsername(username);
    if (!result) {
      throw new Error('Can\'t find username');
    }
    const user_id = result.rows[0].id;
    const { rows } = await query(
      'SELECT * FROM products WHERE user_id = $1',
      [user_id]
    );
    return rows || null;
  } catch (err) {
    throw err;
  }
};

const getProducts = async (column = 'price', sort = 'asc') => {
  let queryString = 'SELECT * FROM products ORDER BY $1';
  if (sort.toLowerCase() === 'asc') queryString += ' ASC';
  if (sort.toLowerCase() === 'desc') queryString += ' DESC';
  try {
    const { rows } = await query(
      queryString,
      [column, sort.toUpperCase()]
    );
    return rows || null;
  } catch (err) {
    throw err;
  }
};

const createProduct = async (product) => {
  if (!product.currency) {
    product.currency = 'gbp';
  }
  const { user_id, name, description, price, currency, stock } = product;
  const date = new Date();
  try {
    const { rows } = await query(
      'INSERT INTO products \
      (user_id, name, description, price, currency, stock, listed_at) \
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [user_id, name, description, price, currency, stock, date.toISOString()]
    );
    return rows[0] || null;
  } catch (err) {
    throw err;
  }
};

const updateProductById = async (user_id, product_id, updates) => {
  const { name, description, price, currency, stock } = updates;
  try {
    const result = await getProductById(product_id);
    if (!result) {
      throw new Error('Product not found');
    }
    if (result.rows[0].user_id !== user_id) {
      throw new Error("Can't update other user's products");
    }
    const { rows } = await query(
      'UPDATE products \
      SET (name, description, price, currency, stock) = ($1, $2, $3, $4, $5) \
      WHERE id = $6 RETURNING *',
      [name, description, price, currency, stock, product_id]
    );
    return rows[0] || null;
  } catch (err) {
    throw err;
  }
};

const deleteProductById = async (user_id, product_id) => {
  try {
    const result = await getProductById(product_id);
    if (!result) {
      throw new Error('Product not found');
    }
    if (result.rows[0].user_id !== user_id) {
      throw new Error("Can't delete other user's products");
    }
    const { rows } = await query(
      'DELETE FROM products WHERE id = $1 RETURNING *',
      [id]
    );
    return rows[0] || null;
  } catch (err) {
    throw err;
  }
};

const getUserCart = async (user_id) => {
  try {
    if (!await getUserById(user_id)) {
      throw new Error('User does not exist');
    }
    const { rows } = await query(
      'SELECT * FROM users_carts WHERE user_id = $1',
      [user_id]
    );
    return rows || null;
  } catch (err) {
    throw err;
  }
};

const addProductToCart = async (user_id, product_id, quantity) => {
  try {
    if (!await getUserById(user_id)) {
      throw new Error('User does not exist');
    }
    if (!await getProductById(product_id)) {
      throw new Error('Product does not exist');
    }
    const { rows } = await query(
      'INSERT INTO users_carts \
      (user_id, product_id, quantity) \
      VALUES ($1, $2, $3) RETURNING *',
      [user_id, product_id, quantity]
    );
    return rows[0] || null;
  } catch (err) {
    throw err;
  }
};

const updateProductInCart = async (user_id, product_id, quantity) => {
  try {
    if (!await getUserById(user_id)) {
      throw new Error('User does not exist');
    }
    if (!await getProductById(product_id)) {
      throw new Error('Product does not exist');
    }
    const { rows } = await query(
      'UPDATE users_carts \
      SET quantity = $1 \
      WHERE user_id = $2 AND product_id = $3 RETURNING *',
      [quantity, user_id, product_id]
    );
    return rows[0] || null;
  } catch (err) {
    throw err;
  }
};

const removeProductFromCart = async (user_id, product_id) => {
  try {
    if (!await getUserById(user_id)) {
      throw new Error('User does not exist');
    }
    if (!await getProductById(product_id)) {
      throw new Error('Product does not exist');
    }
    const { rows } = await query(
      'DELETE FROM users_carts \
      WHERE user_id = $1 AND product_id = $2 RETURNING *',
      [user_id, product_id]
    );
    return rows[0] || null;
  } catch (err) {
    throw err;
  }
};

const emptyUserCart = async (user_id) => {
  try {
    if (!await getUserById(user_id)) {
      throw new Error('User does not exist');
    }
    const { rows } = await query(
      'DELETE FROM users_carts \
      WHERE user_id = $1 RETURNING *',
      [user_id]
    );
    return rows || null;
  } catch (err) {
    throw err;
  }
};

module.exports = {
  users: {
    getUserById,
    getUserByUsername,
    getUserByEmail,
    createUser,
    updateUserById,
    deleteUserById,
  },
  products: {
    getProductById,
    getProductsByKeyword,
    getProducts,
    createProduct,
    updateProductById,
    deleteProductById,
  },
  carts: {
    getUserCart,
    addProductToCart,
    updateProductInCart,
    removeProductFromCart,
    emptyUserCart,
  },
};

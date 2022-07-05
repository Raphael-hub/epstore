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

const tableHasColumn = async (column) => {
  try {
    const { rows } = await query(
      'SELECT column_name FROM information_schema.columns \
      WHERE table_name = \'products\''
    );
    if (!rows.includes(column)) {
      return false;
    }
    return true;
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

const getProductsByName = async (name, column = 'listed_at', sort = 'desc') => {
  try {
    if (!await tableHasColumn(column)) {
      throw new Error('Unknown column to sort by');
    }
    if (!['asc', 'desc'].includes(sort.toLowerCase())) {
      throw new Error('Unknown direction to sort in');
    }
    const { rows } = await query(
      'SELECT * FROM products WHERE name = $1 \
      ORDER BY $2 $3',
      [name, column, sort.toUpperCase()]
    );
    return rows || null;
  } catch (err) {
    throw err;
  }
};

const getProducts = async (column = 'listed_at', sort = 'desc') => {
  try {
    if (!await tableHasColumn(column)) {
      throw new Error('Unknown column to sort by');
    }
    if (!['asc', 'desc'].includes(sort.toLowerCase())) {
      throw new Error('Unknown direction to sort in');
    }
    const { rows } = await query(
      'SELECT * FROM products ORDER BY $1 $2',
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

const updateProductById = async (id, updates) => {
  const { name, description, price, currency, stock } = updates;
  try {
    const result = await getProductById(id);
    if (!result) {
      throw new Error('Product not found');
    }
    const { rows } = await query(
      'UPDATE products \
      SET (name, description, price, currency, stock) = ($1, $2, $3, $4, $5) \
      WHERE id = $6 RETURNING *',
      [name, description, price, currency, stock, id]
    );
    return rows[0] || null;
  } catch (err) {
    throw err;
  }
};

const deleteProductById = async (id) => {
  try {
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
    getProductsByName,
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

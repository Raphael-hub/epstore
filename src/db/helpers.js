const { query, getClient } = require('./index.js');

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
    const result = await query(
      'DELETE FROM users WHERE id = $1',
      [id]
    );
    return result.rowCount;
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
  let queryString = 'SELECT products.id, username, products.name, description, \
      price, currency, stock, listed_at FROM products \
      JOIN users ON user_id = users.id \
      WHERE products.name ILIKE $1 OR description ILIKE $1 ORDER BY $2';
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
    const user = await getUserByUsername(username);
    if (!user) {
      throw new Error('Can\'t find username');
    }
    const { rows } = await query(
      'SELECT products.id, username, products.name, description, \
      price, currency, stock, listed_at FROM products \
      JOIN users ON user_id = users.id \
      WHERE user_id = $1 ORDER BY listed_at DESC',
      [user.id]
    );
    return rows || null;
  } catch (err) {
    throw err;
  }
};

const getProducts = async (column = 'price', sort = 'asc') => {
  let queryString = 'SELECT products.id, username, products.name, description, \
      price, currency, stock, listed_at FROM products \
      JOIN users ON user_id = users.id ORDER BY $1';
  if (sort.toLowerCase() === 'asc') queryString += ' ASC';
  if (sort.toLowerCase() === 'desc') queryString += ' DESC';
  try {
    const { rows } = await query(
      queryString,
      [column]
    );
    return rows || null;
  } catch (err) {
    throw err;
  }
};

const createProduct = async (user_id, product) => {
  if (!product.currency) {
    product.currency = 'gbp';
  }
  const { name, description, price, currency, stock } = product;
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
    const product = await getProductById(product_id);
    if (!product) {
      throw new Error('Product not found');
    }
    if (product.user_id !== user_id) {
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
    const product = await getProductById(product_id);
    if (!product) {
      throw new Error('Product not found');
    }
    if (product.user_id !== user_id) {
      throw new Error("Can't delete other user's products");
    }
    const result = await query(
      'DELETE FROM products WHERE id = $1',
      [product_id]
    );
    return result.rowCount;
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
      'SELECT product_id, quantity FROM users_carts WHERE user_id = $1',
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
      VALUES ($1, $2, $3) RETURNING product_id, quantity',
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
      WHERE user_id = $2 AND product_id = $3 RETURNING product_id, quantity',
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
    const result = await query(
      'DELETE FROM users_carts \
      WHERE user_id = $1 AND product_id = $2',
      [user_id, product_id]
    );
    return result.rowCount;
  } catch (err) {
    throw err;
  }
};

const emptyUserCart = async (user_id) => {
  try {
    if (!await getUserById(user_id)) {
      throw new Error('User does not exist');
    }
    const result = await query(
      'DELETE FROM users_carts \
      WHERE user_id = $1',
      [user_id]
    );
    return result.rowCount;
  } catch (err) {
    throw err;
  }
};

const getOrderById = async (user_id, order_id) => {
  try {
    if (!await getUserById(user_id)) {
      throw new Error('User does not exist');
    }
    const { rows } = await query(
      'SELECT id, status, created_at FROM orders \
      WHERE id = $1 AND user_id = $2',
      [order_id, user_id]
    );
    return rows[0] || null;
  } catch (err) {
    throw err;
  }
};

const getOrdersByUser = async (user_id) => {
  try {
    if (!await getUserById(user_id)) {
      throw new Error('User does not exist');
    }
    const { rows } = await query(
      'SELECT id, status, created_at FROM orders \
      WHERE user_id = $1',
      [user_id]
    );
    return rows || null;
  } catch (err) {
    throw err;
  }
};

const getOrderProductsFromOrder = async (user_id, order_id) => {
  try {
    const order = await getOrderById(user_id, order_id);
    if (!order) {
      throw new Error('Unable to find order');
    }
    const { rows } = await query(
      'SELECT product_id, quantity FROM orders_products \
      WHERE order_id = $1',
      [order_id]
    );
    return {
      order: {
        id: order.id,
        status: order.status,
        created_at: order.created_at
      },
      products: rows
    };
  } catch (err) {
    throw err;
  }
};

const createOrderFromCart = async (user_id) => {
  const client = await getClient();
  try {
    if (!await getUserById(user_id)) {
      throw new Error('User does not exist');
    }
    const cart = await getUserCart(user_id);
    if (cart.length === 0) {
      throw new Error('Cart is empty');
    }
    await client.query('BEGIN');
    const date = new Date();
    const order = await client.query(
      'INSERT INTO orders (user_id, created_at) \
      VALUES ($1, $2) RETURNING id, status, created_at',
      [user_id, date.toISOString()]
    );
    let items = [];
    for (let i = 0; i < cart.length; i++) {
      let product = await getProductById(cart[i].product_id);
      if (!product) {
        throw new Error('Product does not exist');
      }
      if (product.stock - cart[i].quantity < 0) {
        throw new Error('Product does not have enough stock');
      }
      const res = await client.query(
        'INSERT INTO orders_products (order_id, product_id, quantity) \
        VALUES ($1, $2, $3) RETURNING product_id, quantity',
        [order.rows[0].id, cart[i].product_id, cart[i].quantity]
      );
      await client.query(
        'UPDATE products SET stock = stock - $1 \
        WHERE id = $2',
        [cart[i].quantity, cart[i].product_id]
      );

      items.push(res.rows[0]);
    }
    await client.query(
      'DELETE FROM users_carts WHERE user_id = $1',
      [user_id]
    );
    await client.query('COMMIT');
    return { order: order.rows[0], products: items };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const createOrderFromProduct = async (user_id, product_id, quantity) => {
  const client = await getClient();
  try {
    if (!await getUserById(user_id)) {
      throw new Error('User does not exist');
    }
    const product = await getProductById(product_id);
    if (!product) {
      throw new Error('Product does not exist');
    }
    if (product.stock - quantity < 0) {
      throw new Error('Product does not have enough stock');
    }
    await client.query('BEGIN');
    const date = new Date();
    const order = await client.query(
      'INSERT INTO orders (user_id, created_at) \
      VALUES ($1, $2) RETURNING id, status, created_at',
      [user_id, date.toISOString()]
    );
    const items = await client.query(
      'INSERT INTO orders_products (order_id, product_id, quantity) \
      VALUES ($1, $2, $3) RETURNING product_id, quantity',
      [order.rows[0].id, product_id, quantity]
    );
    await client.query(
      'UPDATE products SET stock = stock - $1 \
      WHERE id = $2',
      [quantity, product_id]
    );
    await client.query('COMMIT');
    return { order: order.rows[0], products: items.rows[0] };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const cancelOrder = async (user_id, order_id) => {
  const client = await getClient();
  try {
    if (!await getUserById(user_id)) {
      throw new Error('User does not exist');
    }
    const order = await getOrderById(user_id, order_id);
    if (!order) {
      throw new Error('Unable to find order');
    }
    if (order.status === 'cancelled') {
      throw new Error('Order already cancelled');
    }
    if (order.status !== 'pending') {
      throw new Error('Can\'t cancel an order being processed');
    }
    await client.query('BEGIN');
    const { rows } = await client.query(
      "UPDATE orders SET status = 'cancelled' \
      WHERE user_id = $1 AND id = $2 RETURNING id, status, created_at",
      [user_id, order_id]
    );
    const items = await client.query(
      'SELECT * FROM orders_products WHERE order_id = $1',
      [order_id]
    );
    for (let i = 0; i < items.rows.length; i++) {
      let product = await getProductById(items.rows[i].product_id);
      if (!product) {
        throw new Error('Product does not exist');
      }
      await client.query(
        'UPDATE products SET stock = stock + $1 \
        WHERE id = $2',
        [items.rows[i].quantity, items.rows[i].product_id]
      );
    }
    await client.query('COMMIT');
    return rows || null;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
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
    getProductsByUser,
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
  orders: {
    getOrderById,
    getOrdersByUser,
    getOrderProductsFromOrder,
    createOrderFromCart,
    createOrderFromProduct,
    cancelOrder,
  },
};

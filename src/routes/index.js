const register = require('./register.js');
const login = require('./login.js');
const logout = require('./logout.js');
const profile = require('./profile.js');
const products = require('./products.js');
const cart = require('./cart.js');
const orders = require('./orders.js');

module.exports = app => {
  app.use('/register', register);
  app.use('/login', login);
  app.use('/logout', logout);
  app.use('/profile', profile);
  app.use('/products', products);
  app.use('/cart', cart);
  app.use('/orders', orders);
};

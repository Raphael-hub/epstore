const register = require('./register.js');
const login = require('./login.js');

module.exports = app => {
  app.use('/register', register);
  app.use('/login', login);
};

const register = require('./register.js');

module.exports = app => {
  app.use('/register', register)
};

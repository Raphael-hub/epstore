const register = require('./register.js');
const login = require('./login.js');
const logout = require('./logout.js');
const profile = require('./profile.js');

module.exports = app => {
  app.use('/register', register);
  app.use('/login', login);
  app.use('/logout', logout);
  app.use('/profile', profile);
};

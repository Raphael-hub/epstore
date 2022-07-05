const router = require('express').Router();
const bcrypt = require('bcrypt');
const { users } = require('../db/helpers.js');
const { isLoggedOut } = require('../utils/loggedIn.js');

router.post('/', isLoggedOut, async (req, res, next) => {
  const { username, password, email, name } = req.body;
  if (!username || !password || !email || !name) {
    return next({ message: 'Missing user data' });
  }
  try {
    if (await users.getUserByUsername(username)) {
      return res.status(403).json({ error: 'Username already exists' });
    }
    if (await users.getUserByEmail(email)) {
      return res.status(403).json({ error: 'Email already in use' });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const userObject = { username, password: hashedPassword, email, name, address: null };

    const user = await users.createUser(userObject);
    if (!user) {
      return next({ message: 'Error creating user' });
    }
    req.login(user, error => {
      if (error) {
        throw error;
      }
      return res.redirect('/profile');
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;

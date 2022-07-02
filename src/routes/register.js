const router = require('express').Router();
const bcrypt = require('bcrypt');
const db = require('../db/helpers.js');

router.post('/', async (req, res, next) => {
  const { username, password, email, name, address } = req.body;
  if (!username || !password || !email || !name || !address) {
    return next({ message: 'Missing user data' });
  }
  try {
    if (await db.getUserByUsername(username)) {
      res.status(403).json({ error: 'Username already exists' });
    } else if (await db.getUserByEmail(email)) {
      res.status(403).json({ error: 'Email already in use' });
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const userObject = { username, password: hashedPassword, email, name, address };

      const user = await db.createUser(userObject);
      if (user !== null) {
        req.login(user, error => {
          if (error) {
            throw error;
          }
          return res.redirect('/profile');
        });
      } else {
        return next({ message: 'Unable to create user' });
      }
    }
  } catch (err) {
    return next(err);
  }
});

module.exports = router;

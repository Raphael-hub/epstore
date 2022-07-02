const Router = require('express-promise-router');
const bcrypt = require('bcrypt');
const db = require('../db/helpers.js');

const router = new Router();

router.post('/', async (req, res, next) => {
  const { username, password, email, name, address } = req.body;
  try {
    if (await db.getUserByUsername(username)) {
      res.status(403).json({ info: 'Username already exists' });
    } else if (await db.getUserByEmail(email)) {
      res.status(403).json({ info: 'Email already in use' });
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
          res.status(201).json({ info: `User created with id: ${req.user.id}` });
        });
      }
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;

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
      const user = { username, password: hashedPassword, email, name, address };

      const result = await db.createUser(user);
      res.status(201).json(result);
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;

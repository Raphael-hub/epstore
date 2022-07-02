const Router = require('express-promise-router');
const router = new Router();

const db = require('../db/helpers.js');

router.post('/', async (req, res, next) => {
  const { username, password, email, name, address } = req.body;
  const user = { username, password, email, name, address };
  try {
    if (await db.getUserByUsername(username)) {
      res.status(403).json({ info: 'Username already exists' });
    } else if (await db.getUserByEmail(email)) {
      res.status(403).json({ info: 'Email already in use' });
    } else {
      const result = await db.createUser(user);
      res.status(201).json(result);
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;

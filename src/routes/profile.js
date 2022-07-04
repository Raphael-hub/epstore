const router = require('express').Router();
const bcrypt = require('bcrypt');
const db = require('../db/helpers.js');

const isLoggedIn = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  return next();
};

router.get('/', isLoggedIn, (req, res, next) => {
  return res.status(200).json(req.user);
});

router.put('/update', isLoggedIn, async (req, res, next) => {
  try {
    // Fill from current user details and update any changes from body
    const changes = req.body;
    if (changes.password && changes.password !== req.user.password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(changes.password, salt);
      changes.password = hashedPassword;
    }
    const updated = { ...req.user, ...changes };
    const user = await db.updateUserById(req.user.id, updated);
    if (!user) {
      return next({ message: 'Unable to update user' });
    }
    return res.status(200).json(user);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;

const router = require('express').Router();
const bcrypt = require('bcrypt');
const db = require('../db/helpers.js');
const { isLoggedIn } = require('../utils/loggedIn.js');

router.get('/', isLoggedIn, (req, res, next) => {
  return res.status(200).json(req.user);
});

router.delete('/', isLoggedIn, async (req, res, next) => {
  try {
    const deleted = await db.deleteUserById(req.user.id);
    if (deleted === null) {
      return next({ message: 'Unable to delete user' });
    }
    req.logout(err => {
      if (err) {
        throw err;
      }
      return res.status(200).json({ info: `Deleted user ${deleted.username}` })
    });
  } catch (err) {
    return next(err);
  }
});

router.put('/', isLoggedIn, async (req, res, next) => {
  try {
    // Fill from current user details and update any changes from body
    const changes = req.body;
    if (changes.password && changes.password !== req.user.password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(changes.password, salt);
      changes.password = hashedPassword;
    }
    const updated = { ...req.user, ...changes };
    if (JSON.stringify(updated) === JSON.stringify(req.user)) {
      return res.status(400).json({ info: 'No changes given' });
    }
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

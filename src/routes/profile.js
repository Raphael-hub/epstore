const router = require('express').Router();
const bcrypt = require('bcrypt');
const _ = require('lodash');
const { users, products } = require('../db/helpers.js');
const { isLoggedIn } = require('../utils/loggedIn.js');

router.get('/', isLoggedIn, async (req, res, next) => {
  try {
    const orders = await users.getVendorOrders(req.user.id);
    const response = {
      user: _.omit(req.user, ['id', 'password'])
    };
    if (orders.length > 0) response.orders = orders
    return res.status(200).json(response);
  } catch (err) {
    return next(err);
  }
});

router.delete('/', isLoggedIn, async (req, res, next) => {
  try {
    const result = await users.deleteUserById(req.user.id);
    if (!result) {
      return next({ message: 'Error deleting user' });
    }
    req.logout(err => {
      if (err) {
        throw err;
      }
      return res.status(200).json({ info: `Deleted user` })
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
    const user = await users.updateUserById(req.user.id, updated);
    if (!user) {
      return next({ message: 'Error updating user' });
    }
    return res.status(200).json({ user: _.omit(user, ['id', 'password']) });
  } catch (err) {
    return next(err);
  }
});

router.get('/:username', async (req, res, next) => {
  const username = req.params.username;
  try {
    if (!await users.getUserByUsername(username)) {
      return res.status(400).json({ error: 'Username not found' });
    }
    const listings = await products.getProductsByUser(username);
    if (!listings) {
      return res.status(200).json({ info: 'This user has no products' });
    }
    return res.status(200).json({ user: username, products: listings });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;

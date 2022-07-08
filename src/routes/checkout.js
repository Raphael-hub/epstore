const router = require('express').Router();
const { orders } = require('../db/helpers.js');
const { isLoggedIn } = require('../utils/loggedIn.js');

router.post('/', isLoggedIn, async (req, res, next) => {
  try {
    const order = await orders.createOrderFromCart(req.user.id);
    if (!order) {
      return next({ message: 'Error creating order' });
    }
    return res.status(201).json(order);
  } catch (err) {
    return next(err);
  }
});

router.post('/:product_id', isLoggedIn, async (req, res, next) => {
  const product_id = parseInt(req.params.product_id);
  const quantity = req.body.quantity;
  try {
    const order = await orders.createOrderFromProduct(req.user.id, product_id, quantity);
    if (!order) {
      return next({ message: 'Error creating order' });
    }
    return res.status(201).json(order);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;

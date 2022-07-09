const router = require('express').Router();
const { orders } = require('../db/helpers.js');
const { isLoggedIn } = require('../utils/loggedIn.js');

router.get('/', isLoggedIn, async (req, res, next) => {
  try {
    const results = await orders.getOrdersByUser(req.user.id);
    if (!results) {
      return next({ message: 'Error fetching orders' });
    }
    return res.status(200).json({ orders: results });
  } catch (err) {
    return next(err);
  }
});

router.get('/:order_id', isLoggedIn, async (req, res, next) => {
  const id = parseInt(req.params.order_id);
  try {
    const order = await orders.getOrderProductsFromOrder(req.user.id, id);
    if (!order) {
      return next({ message: 'Error fetching order details' });
    }
    return res.status(200).json(order);
  } catch (err) {
    return next(err);
  }
});






router.delete('/:order_id', isLoggedIn, async (req, res, next) => {
  const id = parseInt(req.params.order_id);
  try {
    const order = await orders.cancelOrder(req.user.id, id);
    if (!order) {
      return next({ message: 'Error cancelling order' });
    }
    return res.status(200).json(order);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;

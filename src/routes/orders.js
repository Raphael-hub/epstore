const router = require('express').Router();
const { orders } = require('../db/helpers.js');
const { isLoggedIn } = require('../utils/loggedIn.js');
const checkUserOwnsProduct = require('../utils/userOwns.js');

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

router.put('/:order_id', isLoggedIn,  async (req, res, next) => {
  const id = parseInt(req.params.order_id);
  const { status } = req.body;
  let result;
  try {
    if (status === 'shipped') {
      result = await orders.shipOrder(req.user.id, id);
      if (!result) {
        return next({ message: 'Error updating order' });
      }
    }
    return res.status(200).json({ order: result });
  } catch (err) {
    return next(err);
  }
});

router.put('/:order_id/:product_id', isLoggedIn, checkUserOwnsProduct,
async (req, res, next) => {
  const order_id = parseInt(req.params.order_id);
  const { status } = req.body;
  let result;
  try {
    let result;
    if (status === 'shipped') {
      result = await orders.shipOrderProduct(
                             req.user.id,
                             order_id,
                             res.locals.product.id,
                           );
      if (!result) {
        return next({ message: 'Error updating product in order' });
      }
    }
    return res.status(200).json({ order: result });
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
    return res.status(200).json({ order: order });
  } catch (err) {
    return next(err);
  }
});

router.delete('/:order_id/:product_id', isLoggedIn, async (req, res, next) => {
  const order_id = parseInt(req.params.order_id);
  const product_id = parseInt(req.params.product_id);
  try {
    const order = await orders.cancelOrderProduct(req.user.id, order_id, product_id);
    if (!order) {
      return next({ message: 'Error cancelling product in order' });
    }
    return res.status(200).json({ order: order });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;

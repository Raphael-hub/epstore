const router = require('express').Router();
const { carts } = require('../db/helpers.js');
const { isLoggedIn } = require('../utils/loggedIn.js');
const { getProductStock } = require('../utils/inStock.js');

router.get('/', isLoggedIn, async (req, res, next) => {
  try {
    const cart = await carts.getUserCart(req.user.id);
    if (cart.length === 0) {
      return res.status(200).json({ info: 'Cart is empty' });
    }
    return res.status(200).json({ cart: cart });
  } catch (err) {
    return next(err);
  }
});

router.post('/', isLoggedIn, async (req, res, next) => {
  const { product_id, quantity } = req.body;
  try {
    const productStock = await getProductStock(product_id);
    if (productStock === -1) {
      return next({ message: 'Product not found' });
    }
    if ((productStock - quantity) < 0) {
      return next({ message: 'Not enough stock' });
    }
    const cart = await carts.getUserCart(req.user.id);
    if (cart.filter(i => i.product_id === product_id).length > 0) {
      return res.status(403).json({ error: 'Product already in cart' });
    }
    const insert = await carts.addProductToCart(req.user.id, product_id, quantity);
    if (!insert) {
      return next({ message: 'Unable to add product to cart' });
    }
    const newCart = [ ...cart, insert ];
    return res.status(201).json({ cart: newCart })
  } catch (err) {
    return next(err);
  }
});

router.put('/', isLoggedIn, async (req, res, next) => {
  const { product_id, quantity } = req.body;
  try {
    const productStock = await getProductStock(product_id);
    if (productStock === -1) {
      return next({ message: 'Product not found' });
    }
    if ((productStock - quantity) < 0) {
      return next({ message: 'Not enough stock' });
    }
    const updated = await carts.updateProductInCart(req.user.id, product_id, quantity);
    if (!updated) {
      return next({ message: 'Error updating quantity' });
    }
    return res.redirect('/cart');
  } catch(err) {
    return next(err);
  }
});

router.delete('/', isLoggedIn, async (req, res, next) => {
  try {
    const { product_id } = req.body;
    const result = await carts.removeProductFromCart(req.user.id, product_id);
    if (!result) {
      return next({ message: 'Error removing product from cart' });
    }
    return res.status(200).json({
      info: `Removed product from cart`
    });
  } catch (err) {
    return next(err);
  }
});

router.post('/clear', isLoggedIn, async (req, res, next) => {
  try {
    const result = await carts.emptyUserCart(req.user.id);
    if (!result) {
      return next({ message: 'Error clearing cart' });
    }
    return res.status(200).json({ info: 'Emptied cart' });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;

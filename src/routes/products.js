const router = require('express').Router();
const { products } = require('../db/helpers.js');
const _ = require('lodash');
const { isLoggedIn } = require('../utils/loggedIn.js');
const { isInStock, getProductStock } = require('../utils/inStock.js');
const checkUserOwnsProduct = require('../utils/userOwns.js');

router.get('/', async (req, res, next) => {
  const { keyword, orderBy, sort } = req.query;
  try {
    let listings = [];
    if (keyword) {
      listings = await products.getProductsByKeyword(keyword, orderBy, sort);
    } else {
      listings = await products.getProducts(orderBy, sort);
    }
    if (!listings) {
      return next({ message: 'Error fetching products' });
    }
    return res.status(200).json({ products: listings });
  } catch (err) {
  return next(err);
  }
});

router.post('/', isLoggedIn, async (req, res, next) => {
  try {
    const insert = await products.createProduct(req.user.id, req.body);
    if (!insert) {
      return next({ message: 'Error creating product' });
    }
    return res.status(201).json({ product: _.omit(insert, ['user_id']) });
  } catch (err) {
    return next(err);
  }
});


router.put('/:id', isLoggedIn, checkUserOwnsProduct, async (req, res, next) => {
  const product_id = res.locals.product.id;
  const updates = req.body;
  try {
    const old = res.locals.product;
    const mergedProduct = { ...old, ...updates };
    if (mergedProduct.quantity < 1) {
      return res.status(400).json({ error: 'Cannot set quantity to less than 1' });
    }
    const updated = await products.updateProductById(req.user.id, product_id, mergedProduct);
    if (!updated) {
      return next({ message: 'Error updating product' });
    }
    return res.status(200).json({ product: _.omit(updated, ['user_id']) });
  } catch(err) {
    return next(err);
  }
});


router.delete('/:id', isLoggedIn, checkUserOwnsProduct, async (req, res, next) => {
  const product_id = res.locals.product.id;
  try {
    const result = await products.deleteProductById(req.user.id, product_id);
    if (!result) {
      return next({ message: 'Error removing product' });
    }
    return res.status(200).json({
      info: `Removed product id: ${product_id}`
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;

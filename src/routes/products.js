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
  const product = { ...req.body, user_id: req.user.id};
  try {
    const insert = await product.createProduct(product);
    if (!insert) {
      
      return next({ message: 'Error creating product' });
    }
    return res.status(201).json({ product: insert });
  } catch (err) {
    return next(err);
  }
});


router.put('/:id', isLoggedIn, checkUserOwnsProduct, async (req, res, next) => {
  const { product_id } = req.params.id;
  const  updates  = req.body;
  
  try {
    const product = await products.getProductById(product_id);
    if (!product) {
      return next({ message: 'Error fetching product' });
    }
    // this merges the new state
    const mergedProduct = { ...product, ...updates };
    // check quantity is > 0
    if (mergedProduct.quantity < 1) {
      return res.status(400).json({ error: 'Cannot set quantity to less than 1' });
    }
    
    const updated = await products.updateProductById(req.user.id, product_id, updates);
    if (!updated) {
      return next({ message: 'Error updating product' });
    }
    return res.status(200).json({ product: _.omit(updated, ['user_id']) });
  } catch(err) {
    return next(err);
  }
});


router.delete('/:id', isLoggedIn, checkUserOwnsProduct, async (req, res, next) => {
  const { product_id } = req.params.id;
  try {
    const deleted = await products.deleteProductById(product_id);
    if (!deleted) {
      return next({ message: 'Unable to remove product' });
    }
    return res.status(200).json({
      info: `Removed product ${product_id} from products`
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
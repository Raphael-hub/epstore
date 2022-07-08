
const router = require('express').Router();
const { products } = require('../db/helpers.js');

const { isLoggedIn } = require('../utils/loggedIn.js');
const { isInStock } = require('../utils/inStock.js');
const {checkUserOwnsProduct} = require('../utils/userOwns.js')

// get all products
// ***** check getProducts below --not sure I used the correct parameters see big comment above,
router.get('/', async (req, res, next) => {
  // naming here is just easier for someone to understand
  // if these are not present they will evaluate to undefined
  // when you pass undefined args into a function with default values
  // the default values will be used
  const { keyword, orderBy, sort } = req.query;
  try {
    let listings = [];
    // normally I don't use else statements but here it comes in handy so
    // we dont have to write the return and error statements twice
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
    console.log(err);
    return next(err);
    
    
  }
});



 // add new product
 // ****check const allProducts line, allProducts.filter line
  router.post('/', isLoggedIn, async (req, res, next) => {
    const { product } = req.body;
    // not sure about the one below, alternative = const {product_id} = req.body;
    const {product_id } = product.id;
    try {
      
      const  allProducts = await products.getProducts('listed_at', 'desc');

      if (allProducts.filter(i => i.product_id === product_id).length > 0) {
        return res.status(403).json({ error: 'Product already exists' });
      }
      const insert = await product.createProduct(product);
      if (!insert) {
        return next({ message: 'Unable to add product' });
      }
      const updatedAllProducts = [ ...allProducts, insert ];
      return res.status(201).json({ allProducts: updatedAllProducts })
    } catch (err) {
      return next(err);
    }
  });
 // update one product by id
 
  router.put('/:id', isLoggedIn,checkUserOwnsProduct, async (req, res, next) => {
    const { product_id } = req.params.id;
    const {updates} = req.query
    
    try {

      if ((await getProductStock(product_id) - updates.quantity) < 0) {
        return next({ message: 'Not enough stock' });
      }
      const updated = await products.updateProductById(product_id, updates);
      if (!updated) {
        return next({ message: 'Error updating product' });
      }
      return res.status(200).json({
        info: `Updated product ${product_id} to new quantity of ${quantity}`
      });
    } catch(err) {
      return next(err);
    }
  });

  // delete product by id
  router.delete('/:id', isLoggedIn, checkUserOwnsProduct, async (req, res, next) => {
    try {
      const { product_id } = req.params.id;
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

  // delete/clear products in table 




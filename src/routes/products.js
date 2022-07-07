/* TODO
 * Add URL queries for sorting
 * Add URL params for product IDs
 * Remove isLoggedIn checks where not needed
 */
const router = require('express').Router();
const { products } = require('../db/helpers.js');

const { isLoggedIn } = require('../utils/loggedIn.js');
const { isInStock } = require('../utils/inStock.js');

//get one product by Id
router.get('/', isLoggedIn, async (req, res, next) => {
    const {product_id} = req.body
    try {
      const  product = await products.getProductById(product_id);
      if (product.length === 0) {
        return res.status(200).json({ info: 'Product not availabe' });
      }
      return res.status(200).json({ product: product });
    } catch (err) {
      return next(err);
    }
  });

router.get('/', async (req, res, next)=> {
   const {query} = req.query;
   try {
    if (Object.keys(query).length ===0) {
      const product = await products.getProducts();
      return res.status(200).json({product: product});

     } else if (query.column || query.sort) {
      const product = await products.getProducts(query.column, query.sort);
      return res.status(200).json({product: product});

      } else if (query.keyword) {
        const product = await products.getProductsByKeyword(query.keyword, query.column, query.sort);
        return res.status(200).json({product: product});

      }
     
   } catch (err) {
    return next(err);
   }
  

});














// get one product by name
// *****check getProductsByName --not sure if I should enter (column, sort) as parameters
// since you e.g. gave default column value 'listed_at', yet you have code that checks if the column is empty,
//despite it not being able to be empty since it will always have the placeholder, No?
router.get('/', isLoggedIn, async (req, res, next) => {
  const {product_name, column, sort} = req.body
  try {
    const  product = await products.getProductsByName(product_name, column, sort);
    if (product.length === 0) {
    return res.status(200).json({ info: 'Product not availabe' });
    }
    return res.status(200).json({ product: product });
  } catch (err) {
    return next(err);
  }
});

// get all products
// ***** check getProducts below --not sure I used the correct parameters see big comment above,
router.get('/', isLoggedIn, async (req, res, next) => {
  const {column, sort} = req.body
  try {
    const  allProducts = await products.getProducts(column, sort);
    return res.status(200).json({ product: allProducts });
  } catch (err) {
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
// **** check if await getProductStock(product_id)-product.quantity line
// I don't think you can do product.quantity
//*** check {product} = req.body
router.put('/', isLoggedIn, async (req, res, next) => {
  const { product_id, updates } = req.body;
  const { product } = req.body;
  try {
    if ((await getProductStock(product_id) - product.quantity) < 0) {
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
router.delete('/', isLoggedIn, async (req, res, next) => {
  const { product_id } = req.body;
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

// delete/clear products in table

module.exports = router;

const { products } = require('../db/helpers.js');

const checkUserOwnsProduct = async (req, res, next) => {
  const id = parseInt(req.params.product_id);
  if (!id) {
    return next({ message: 'Invalid product id' })
  }
  try {
    const product = await products.getProductById(id);
    if (!product) {
      return next({ message: 'Error fetching product' });
    }
    if (product.user_id !== req.user.id) {
      return res.status(403).json({ error: 'User cannot alter this product' });
    }
    res.locals.product = product;
    return next();
  } catch (err) {
    return next(err);
  }
};

module.exports = checkUserOwnsProduct;

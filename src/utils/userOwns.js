const { products } = require('../db/helpers.js');

const checkUserOwnsProduct = async (req, res, next) => {
  const id = parseInt(req.params.id);
  if (!id) {
    return next({ message: 'Invalid product id' })
  }
  try {
    const product = await products.getProductById(id);
    if (product.user_id !== req.user.id) {
      return res.status(403).json({ error: 'User cannot alter this product' });
    }
    return next();
  } catch (err) {
    return next(err);
  }
};

module.exports = checkUserOwnsProduct;

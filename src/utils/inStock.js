const { products } = require('../db/helpers.js');

const isInStock = async (product_id) => {
  try {
    const product = await products.getProductById(product_id);
    if (product.stock === 0) return false;
    return true;
  } catch (err) {
    throw err;
  }
};

const getProductStock = async (product_id) => {
  try {
    const product = await products.getProductById(product_id);
    if (!product) {
      return -1;
    }
    return product.stock;
  } catch (err) {
    throw err;
  }
};

module.exports = {
  isInStock,
  getProductStock
};

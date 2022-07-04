const isLoggedIn = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  return next();
};

const isLoggedOut = (req, res, next) => {
  if (req.user) {
    return res.status(401).json({ error: 'Already logged in' });
  }
  return next();
};

module.exports = {
  isLoggedIn,
  isLoggedOut
};

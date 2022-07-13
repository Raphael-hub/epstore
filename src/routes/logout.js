const router = require('express').Router();
const { isLoggedIn } = require('../utils/loggedIn.js');

router.post('/', isLoggedIn, (req, res, next) => {
  req.logout(err => {
    if (err) {
      return next(err);
    }
    return res.status(200).json({ info: 'Successfully logged out' });
  });
});

module.exports = router;

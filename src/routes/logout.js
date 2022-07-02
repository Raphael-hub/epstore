const router = require('express').Router();

router.post('/', (req, res, next) => {
  if (!req.user) {
    return res.status(400).json({ error: 'Not currently logged in' });
  }
  req.logout(err => {
    if (err) {
      throw err;
    }
    return res.status(200).json({ info: 'Successfully logged out' });
  });
});

module.exports = router;

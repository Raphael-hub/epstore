const router = require('express').Router();
const db = require('../db/helpers.js');

router.get('/', (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  res.status(200).json(req.user);
});

module.exports = router;

const router = require('express').Router();
const passport = require('passport');
const LocalStrategy = require('passport-local');
const bcrypt = require('bcrypt');
const db = require('../db/helpers.js');

passport.serializeUser((user, done) => {
  return done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await db.getUserById(id);
    if (user) {
      return done(null, user);
    }
    return done(null, false);
  } catch (err) {
    return done(err);
  }
});

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await db.getUserByUsername(username);
      if (!user) {
        return done(null, false, { message: 'Incorrect username or password' });
      }
      const matchedPassword = await bcrypt.compare(password, user.password);
      if (!matchedPassword) {
        return done(null, false, { message: 'Incorrect username or password' });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

router.get('/', (req, res, next) => {
  if (req.session.messages) {
    return res.status(400).json({ error: req.session.messages[0] });
  }
  if (req.user) {
    return res.status(401).json({ error: 'Already logged in' });
  }
  return res.status(200).json({ info: 'Login with POST' });
});

router.post('/',
  passport.authenticate('local',
    { failureRedirect: 'login', failureMessage: true }),
  (req, res, next) => {
    return res.redirect('/profile');
  }
);

module.exports = router;

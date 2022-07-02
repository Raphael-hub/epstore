const Router = require('express-promise-router');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const bcrypt = require('bcrypt');
const db = require('../db/helpers.js');

const router = new Router();

passport.serializeUser((user, done) => {
  return done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await db.getUserById(id);
    if (user) {
      return done(null, user);
    } else {
      return done(null, false);
    }
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

router.post('/',
  passport.authenticate('local',
    { successRedirect: '/profile',failureRedirect: '/login', failureMessage: true }),
  async (req, res, next) => {
    if (req.session.messages) {
      res.status(400).json(req.session.messages);
    }
    res.status(200).json({ info: `Logged in as user with id: ${req.user.id}` });
  }
);

module.exports = router;

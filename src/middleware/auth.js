const jwt = require('jsonwebtoken');
const User = require('../models/user.js');
require('dotenv').config();

async function auth(req, res, next) {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    // eslint-disable-next-line no-undef
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findOne({
      _id: decoded._id,
      'tokens.token': token,
    });

    if (!user) {
      throw new Error('Invalid user');
    }

    req.token = token;
    req.user = user;
    next();
  } catch (e) {
    res.status(401).send({ error: 'Please authenticate.' });
  }
}

module.exports = auth;

const jwt = require('jsonwebtoken');
const pool = require('../db');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers['authorization'];


  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token missing or malformed' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Use your secret key here
    const userRes = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [decoded.id]);

    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = userRes.rows[0]; // Attach user data to request object
    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = authenticate;

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db'); 

exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *',
      [name, email, hashedPassword]
    );

    const { password: _, ...safeUser } = result.rows[0];
    const token = jwt.sign({ id: safeUser.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ user: safeUser, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Signup failed' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login attempt with email:", email); // Log the email

    // Query the user from the database
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    console.log("User query result:", user.rows); // Log the user query result

    if (user.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    const userData = user.rows[0];
    console.log("Found user:", userData); // Log the found user

    // Compare the password with the hashed one
    const isMatch = await bcrypt.compare(password, userData.password);
    console.log("Password match:", isMatch); // Log if password matches

    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect password' });
    }

    // Exclude password from the user data
    const { password: _, ...safeUser } = userData;

    // Generate a token
    const token = jwt.sign({ id: safeUser.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    console.log("Generated token:", token); // Log the token (avoid logging in production)

    // Send back the user data and token
    res.status(200).json({ user: safeUser, token });
  } catch (error) {
    console.error("Login error:", error); // Log the error
    res.status(500).json({ error: 'Login failed' });
  }
};

// GET /api/auth/me
exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ user: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
};

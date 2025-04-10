const express = require('express');
const router = express.Router();
const { signup, login ,getCurrentUser} = require('../controllers/authController');
const authenticate = require('../middleware/authMiddleware');

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', authenticate, getCurrentUser);


module.exports = router;

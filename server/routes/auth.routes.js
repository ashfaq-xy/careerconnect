// server/routes/auth.routes.js
const router = require('express').Router();
const {
  register, login, logout, refreshToken, verifyEmail,
  forgotPassword, resetPassword,
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);                              // No protect — user may have expired token
router.post('/refresh-token', refreshToken);
router.post('/verify-email', protect, verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

module.exports = router;

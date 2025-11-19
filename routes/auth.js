const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  createAdmin
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const {
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate
} = require('../middleware/validation');

router.post('/register', validateUserRegistration, register);
router.post('/login', validateUserLogin, login);
router.post('/create-admin', validateUserRegistration, createAdmin);

router.get('/me', protect, getMe);
router.put('/profile', protect, validateUserUpdate, updateProfile);
router.put('/password', protect, changePassword);

module.exports = router;
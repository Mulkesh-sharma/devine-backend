const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  toggleUserActive,
  getUserStats,
  getUserBookings
} = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/auth');

// Admin only routes
router.get('/', protect, adminOnly, getUsers);
router.get('/stats', protect, adminOnly, getUserStats);
router.delete('/:id', protect, adminOnly, deleteUser);
router.patch('/:id/toggle-active', protect, adminOnly, toggleUserActive);

// User routes (admin or own user)
router.get('/:id', protect, getUser);
router.put('/:id', protect, updateUser);
router.get('/:id/bookings', protect, getUserBookings);

module.exports = router;
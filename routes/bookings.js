const express = require('express');
const router = express.Router();
const {
  createBooking,
  getBookings,
  getBooking,
  updateBookingStatus,
  cancelBooking,
  rescheduleBooking,
  addReview,
  assignPandit
} = require('../controllers/bookingController');
const { protect, adminOnly } = require('../middleware/auth');
const { validateBooking, validateReview } = require('../middleware/validation');

// All booking routes require authentication
router.use(protect);

// Create booking
router.post('/', validateBooking, createBooking);

// Get bookings (users see their own, admins see all)
router.get('/', getBookings);

// Get single booking
router.get('/:id', getBooking);

// Admin only routes
router.patch('/:id/status', adminOnly, updateBookingStatus);
router.patch('/:id/assign-pandit', adminOnly, assignPandit);

// User actions
router.patch('/:id/cancel', cancelBooking);
router.patch('/:id/reschedule', rescheduleBooking);
router.patch('/:id/review', validateReview, addReview);

module.exports = router;
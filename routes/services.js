const express = require('express');
const router = express.Router();
const {
  getServices,
  getService,
  createService,
  updateService,
  deleteService,
  getPopularServices,
  getServicesByCategory,
  getCategories,
  togglePopular,
  updateRating
} = require('../controllers/serviceController');
const { protect, adminOnly, optionalAuth } = require('../middleware/auth');
const { validateService, validateReview } = require('../middleware/validation');

// Public routes
router.get('/', optionalAuth, getServices);
router.get('/popular', optionalAuth, getPopularServices);
router.get('/category/:category', optionalAuth, getServicesByCategory);
router.get('/categories', optionalAuth, getCategories);
router.get('/:id', optionalAuth, getService);

// Protected routes (admin only)
router.post('/', protect, adminOnly, validateService, createService);
router.put('/:id', protect, adminOnly, validateService, updateService);
router.delete('/:id', protect, adminOnly, deleteService);
router.patch('/:id/popular', protect, adminOnly, togglePopular);

// Rating (any authenticated user)
router.post('/:id/rating', protect, validateReview, updateRating);

module.exports = router;
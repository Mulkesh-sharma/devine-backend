const User = require('../models/User');
const Booking = require('../models/Booking');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private (Admin only)
const getUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build query
  const query = {};
  
  // Filter by role
  if (req.query.role) {
    query.role = req.query.role;
  }

  // Filter by active status
  if (req.query.isActive !== undefined) {
    query.isActive = req.query.isActive === 'true';
  }

  // Search by name or email
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, 'i');
    query.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { phone: searchRegex }
    ];
  }

  // Sort
  let sort = {};
  switch (req.query.sort) {
    case 'name':
      sort = { name: 1 };
      break;
    case 'email':
      sort = { email: 1 };
      break;
    case 'created':
    default:
      sort = { createdAt: -1 };
  }

  const users = await User.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .select('-password');

  const total = await User.countDocuments(query);

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private (Admin or own user)
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Users can only see their own profile
  if (req.user.role === 'user' && req.user.id !== req.params.id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  res.json({
    success: true,
    data: {
      user
    }
  });
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin or own user)
const updateUser = asyncHandler(async (req, res) => {
  let user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Users can only update their own profile (except role)
  if (req.user.role === 'user' && req.user.id !== req.params.id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  const allowedFields = ['name', 'phone', 'avatar'];
  
  // Admin can update additional fields
  if (req.user.role === 'admin') {
    allowedFields.push('isActive', 'role');
  }

  const updateData = {};
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  user = await User.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  ).select('-password');

  res.json({
    success: true,
    message: 'User updated successfully',
    data: {
      user
    }
  });
});

// @desc    Delete user (admin only)
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Check if user has bookings
  const bookingCount = await Booking.countDocuments({ user: req.params.id });
  if (bookingCount > 0) {
    // Instead of deleting, deactivate the user
    user.isActive = false;
    await user.save();
    
    return res.json({
      success: true,
      message: 'User deactivated successfully (has existing bookings)'
    });
  }

  await User.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
});

// @desc    Toggle user active status (admin only)
// @route   PATCH /api/users/:id/toggle-active
// @access  Private (Admin only)
const toggleUserActive = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  user.isActive = !user.isActive;
  await user.save();

  res.json({
    success: true,
    message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
    data: {
      user: user.getPublicProfile()
    }
  });
});

// @desc    Get user statistics (admin only)
// @route   GET /api/users/stats
// @access  Private (Admin only)
const getUserStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ isActive: true });
  const adminUsers = await User.countDocuments({ role: 'admin' });
  const regularUsers = await User.countDocuments({ role: 'user' });

  // New users in last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const newUsers = await User.countDocuments({
    createdAt: { $gte: thirtyDaysAgo }
  });

  res.json({
    success: true,
    data: {
      stats: {
        totalUsers,
        activeUsers,
        adminUsers,
        regularUsers,
        newUsers
      }
    }
  });
});

// @desc    Get user's bookings
// @route   GET /api/users/:id/bookings
// @access  Private (Admin or own user)
const getUserBookings = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Users can only see their own bookings
  if (req.user.role === 'user' && req.user.id !== req.params.id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  // Build query
  const query = { user: req.params.id };

  // Filter by status
  if (req.query.status) {
    query.status = req.query.status;
  }

  // Filter by date range
  if (req.query.startDate || req.query.endDate) {
    query.bookingDate = {};
    if (req.query.startDate) {
      query.bookingDate.$gte = new Date(req.query.startDate);
    }
    if (req.query.endDate) {
      query.bookingDate.$lte = new Date(req.query.endDate);
    }
  }

  // Sort
  let sort = {};
  switch (req.query.sort) {
    case 'date-asc':
      sort = { bookingDate: 1 };
      break;
    case 'date-desc':
    default:
      sort = { bookingDate: -1 };
  }

  const bookings = await Booking.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('service', 'title priceINR duration')
    .populate('panditAssigned', 'name phone');

  const total = await Booking.countDocuments(query);

  res.json({
    success: true,
    data: {
      bookings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

module.exports = {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  toggleUserActive,
  getUserStats,
  getUserBookings
};
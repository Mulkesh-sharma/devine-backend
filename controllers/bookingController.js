const Booking = require('../models/Booking');
const Service = require('../models/Service');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private
const createBooking = asyncHandler(async (req, res) => {
  const {
    service,
    bookingDate,
    bookingTime,
    address,
    contactPerson,
    poojaDetails,
    pricing
  } = req.body;

  // Check if service exists and is active
  const serviceDoc = await Service.findById(service);
  if (!serviceDoc || !serviceDoc.isActive) {
    return res.status(400).json({
      success: false,
      message: 'Service is not available'
    });
  }

  // Check for existing booking at same date/time for same service
  const existingBooking = await Booking.findOne({
    service,
    bookingDate: new Date(bookingDate),
    bookingTime,
    status: { $in: ['pending', 'confirmed', 'scheduled', 'in_progress'] }
  });

  if (existingBooking) {
    return res.status(400).json({
      success: false,
      message: 'This time slot is already booked for this service'
    });
  }

  // Calculate total price
  const totalPrice = (pricing.basePrice || serviceDoc.priceINR) + (pricing.additionalCharges || 0);

  // Create booking
  const booking = await Booking.create({
    user: req.user.id,
    service,
    bookingDate: new Date(bookingDate),
    bookingTime,
    address,
    contactPerson,
    poojaDetails,
    pricing: {
      basePrice: pricing.basePrice || serviceDoc.priceINR,
      additionalCharges: pricing.additionalCharges || 0,
      totalPrice,
      paymentMethod: pricing.paymentMethod
    }
  });

  // Increment service booking count
  await Service.incrementBookingCount(service);

  const populatedBooking = await Booking.findById(booking._id)
    .populate('user', 'name email phone')
    .populate('service', 'title priceINR duration')
    .populate('panditAssigned', 'name phone');

  res.status(201).json({
    success: true,
    message: 'Booking created successfully',
    data: {
      booking: populatedBooking
    }
  });
});

// @desc    Get user bookings
// @route   GET /api/bookings
// @access  Private
const getBookings = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build query
  let query = {};
  
  // Users can only see their own bookings
  if (req.user.role === 'user') {
    query.user = req.user.id;
  }

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
    .populate('user', 'name email phone')
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

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
const getBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('user', 'name email phone')
    .populate('service', 'title priceINR duration')
    .populate('panditAssigned', 'name phone')
    .populate('cancelledBy', 'name');

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  // Users can only see their own bookings
  if (req.user.role === 'user' && booking.user._id.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  res.json({
    success: true,
    data: {
      booking
    }
  });
});

// @desc    Update booking status
// @route   PATCH /api/bookings/:id/status
// @access  Private (Admin only)
const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status, adminNotes } = req.body;

  if (!['pending', 'confirmed', 'scheduled', 'in_progress', 'completed', 'cancelled', 'refunded'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status'
    });
  }

  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  booking.status = status;
  if (adminNotes) booking.adminNotes = adminNotes;
  
  // Update payment status based on booking status
  if (status === 'completed') {
    booking.paymentStatus = 'paid';
  } else if (status === 'cancelled') {
    booking.paymentStatus = 'refunded';
  }

  await booking.save();

  const populatedBooking = await Booking.findById(booking._id)
    .populate('user', 'name email phone')
    .populate('service', 'title priceINR duration')
    .populate('panditAssigned', 'name phone');

  res.json({
    success: true,
    message: 'Booking status updated successfully',
    data: {
      booking: populatedBooking
    }
  });
});

// @desc    Cancel booking
// @route   PATCH /api/bookings/:id/cancel
// @access  Private
const cancelBooking = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  // Users can only cancel their own bookings
  if (req.user.role === 'user' && booking.user.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  // Check if booking can be cancelled
  if (!booking.canBeCancelled()) {
    return res.status(400).json({
      success: false,
      message: 'Booking cannot be cancelled (less than 24 hours before booking time)'
    });
  }

  booking.status = 'cancelled';
  booking.cancelledBy = req.user.id;
  booking.cancellationReason = reason;
  booking.cancellationDate = new Date();
  booking.paymentStatus = 'refunded';

  await booking.save();

  const populatedBooking = await Booking.findById(booking._id)
    .populate('user', 'name email phone')
    .populate('service', 'title priceINR duration')
    .populate('panditAssigned', 'name phone')
    .populate('cancelledBy', 'name');

  res.json({
    success: true,
    message: 'Booking cancelled successfully',
    data: {
      booking: populatedBooking
    }
  });
});

// @desc    Reschedule booking
// @route   PATCH /api/bookings/:id/reschedule
// @access  Private
const rescheduleBooking = asyncHandler(async (req, res) => {
  const { bookingDate, bookingTime, reason } = req.body;

  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  // Users can only reschedule their own bookings
  if (req.user.role === 'user' && booking.user.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  // Check if booking can be rescheduled
  if (!booking.canBeRescheduled()) {
    return res.status(400).json({
      success: false,
      message: 'Booking cannot be rescheduled (less than 24 hours before booking time or maximum reschedule limit reached)'
    });
  }

  // Check for existing booking at new date/time
  const existingBooking = await Booking.findOne({
    _id: { $ne: req.params.id },
    service: booking.service,
    bookingDate: new Date(bookingDate),
    bookingTime,
    status: { $in: ['pending', 'confirmed', 'scheduled', 'in_progress'] }
  });

  if (existingBooking) {
    return res.status(400).json({
      success: false,
      message: 'This time slot is already booked for this service'
    });
  }

  // Update booking
  booking.bookingDate = new Date(bookingDate);
  booking.bookingTime = bookingTime;
  booking.rescheduleCount += 1;
  booking.lastRescheduleDate = new Date();
  
  if (reason) {
    booking.adminNotes = (booking.adminNotes || '') + `\nReschedule reason: ${reason}`;
  }

  await booking.save();

  const populatedBooking = await Booking.findById(booking._id)
    .populate('user', 'name email phone')
    .populate('service', 'title priceINR duration')
    .populate('panditAssigned', 'name phone');

  res.json({
    success: true,
    message: 'Booking rescheduled successfully',
    data: {
      booking: populatedBooking
    }
  });
});

// @desc    Add review to booking
// @route   PATCH /api/bookings/:id/review
// @access  Private
const addReview = asyncHandler(async (req, res) => {
  const { rating, review } = req.body;

  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  // Users can only review their own bookings
  if (req.user.role === 'user' && booking.user.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  // Only completed bookings can be reviewed
  if (booking.status !== 'completed') {
    return res.status(400).json({
      success: false,
      message: 'Only completed bookings can be reviewed'
    });
  }

  booking.rating = rating;
  booking.review = review;

  await booking.save();

  // Update service rating
  await Service.updateRating(booking.service, rating);

  const populatedBooking = await Booking.findById(booking._id)
    .populate('user', 'name email phone')
    .populate('service', 'title priceINR duration')
    .populate('panditAssigned', 'name phone');

  res.json({
    success: true,
    message: 'Review added successfully',
    data: {
      booking: populatedBooking
    }
  });
});

// @desc    Assign pandit to booking
// @route   PATCH /api/bookings/:id/assign-pandit
// @access  Private (Admin only)
const assignPandit = asyncHandler(async (req, res) => {
  const { panditId } = req.body;

  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  booking.panditAssigned = panditId;
  await booking.save();

  const populatedBooking = await Booking.findById(booking._id)
    .populate('user', 'name email phone')
    .populate('service', 'title priceINR duration')
    .populate('panditAssigned', 'name phone');

  res.json({
    success: true,
    message: 'Pandit assigned successfully',
    data: {
      booking: populatedBooking
    }
  });
});

module.exports = {
  createBooking,
  getBookings,
  getBooking,
  updateBookingStatus,
  cancelBooking,
  rescheduleBooking,
  addReview,
  assignPandit
};
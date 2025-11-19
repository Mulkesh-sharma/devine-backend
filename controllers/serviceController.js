const Service = require('../models/Service');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Get all services
// @route   GET /api/services
// @access  Public
const getServices = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build query
  const query = { isActive: true };

  // Filter by category
  if (req.query.category) {
    query.category = req.query.category;
  }

  // Filter by pujaLanguage
  if (req.query.pujaLanguage) {
    query.pujaLanguage = req.query.pujaLanguage;
  }

  // Filter by difficulty
  if (req.query.difficulty) {
    query.difficulty = req.query.difficulty;
  }

  // Search by title or description
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, 'i');
    query.$or = [
      { title: searchRegex },
      { description: searchRegex },
      { shortDescription: searchRegex }
    ];
  }

  // Sort options
  let sort = {};
  switch (req.query.sort) {
    case 'price-low':
      sort = { priceINR: 1 };
      break;
    case 'price-high':
      sort = { priceINR: -1 };
      break;
    case 'duration':
      sort = { durationMinutes: 1 };
      break;
    case 'rating':
      sort = { rating: -1 };
      break;
    case 'popular':
    default:
      sort = { isPopular: -1, bookingCount: -1 };
  }

  const services = await Service.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('createdBy', 'name')
    .populate('updatedBy', 'name');

  const total = await Service.countDocuments(query);

  res.json({
    success: true,
    data: {
      services,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Get single service
// @route   GET /api/services/:id
// @access  Public
const getService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id)
    .populate('createdBy', 'name')
    .populate('updatedBy', 'name');

  if (!service) {
    return res.status(404).json({
      success: false,
      message: 'Service not found'
    });
  }

  // Don't show inactive services to regular users
  if (!service.isActive && (!req.user || req.user.role !== 'admin')) {
    return res.status(404).json({
      success: false,
      message: 'Service not found'
    });
  }

  res.json({
    success: true,
    data: {
      service
    }
  });
});

// @desc    Create new service
// @route   POST /api/services
// @access  Private (Admin only)
const createService = asyncHandler(async (req, res) => {
  const serviceData = {
    ...req.body,
    createdBy: req.user.id,
    updatedBy: req.user.id
  };

  const service = await Service.create(serviceData);

  const populatedService = await Service.findById(service._id)
    .populate('createdBy', 'name')
    .populate('updatedBy', 'name');

  res.status(201).json({
    success: true,
    message: 'Service created successfully',
    data: {
      service: populatedService
    }
  });
});

// @desc    Update service
// @route   PUT /api/services/:id
// @access  Private (Admin only)
const updateService = asyncHandler(async (req, res) => {
  let service = await Service.findById(req.params.id);

  if (!service) {
    return res.status(404).json({
      success: false,
      message: 'Service not found'
    });
  }

  const serviceData = {
    ...req.body,
    updatedBy: req.user.id
  };

  service = await Service.findByIdAndUpdate(
    req.params.id,
    serviceData,
    { new: true, runValidators: true }
  ).populate('createdBy', 'name')
   .populate('updatedBy', 'name');

  res.json({
    success: true,
    message: 'Service updated successfully',
    data: {
      service
    }
  });
});

// @desc    Delete service
// @route   DELETE /api/services/:id
// @access  Private (Admin only)
const deleteService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);

  if (!service) {
    return res.status(404).json({
      success: false,
      message: 'Service not found'
    });
  }

  // Check if service has bookings
  const bookingCount = await Service.getBookingCount(req.params.id);
  if (bookingCount > 0) {
    // Instead of deleting, deactivate the service
    service.isActive = false;
    await service.save();
    
    return res.json({
      success: true,
      message: 'Service deactivated successfully (has existing bookings)'
    });
  }

  await Service.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Service deleted successfully'
  });
});

// @desc    Get popular services
// @route   GET /api/services/popular
// @access  Public
const getPopularServices = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 8;

  const services = await Service.find({ 
    isActive: true, 
    isPopular: true 
  })
  .sort({ bookingCount: -1, rating: -1 })
  .limit(limit)
  .populate('createdBy', 'name')
  .populate('updatedBy', 'name');

  res.json({
    success: true,
    data: {
      services
    }
  });
});

// @desc    Get services by category
// @route   GET /api/services/category/:category
// @access  Public
const getServicesByCategory = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const services = await Service.find({ 
    category: req.params.category, 
    isActive: true 
  })
  .sort({ isPopular: -1, bookingCount: -1 })
  .skip(skip)
  .limit(limit)
  .populate('createdBy', 'name')
  .populate('updatedBy', 'name');

  const total = await Service.countDocuments({ 
    category: req.params.category, 
    isActive: true 
  });

  res.json({
    success: true,
    data: {
      services,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Get service categories
// @route   GET /api/services/categories
// @access  Public
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Service.distinct('category', { isActive: true });

  res.json({
    success: true,
    data: {
      categories
    }
  });
});

// @desc    Toggle service popularity
// @route   PATCH /api/services/:id/popular
// @access  Private (Admin only)
const togglePopular = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);

  if (!service) {
    return res.status(404).json({
      success: false,
      message: 'Service not found'
    });
  }

  service.isPopular = !service.isPopular;
  service.updatedBy = req.user.id;
  await service.save();

  res.json({
    success: true,
    message: `Service ${service.isPopular ? 'marked as' : 'removed from'} popular`,
    data: {
      service
    }
  });
});

// @desc    Update service rating
// @route   POST /api/services/:id/rating
// @access  Private
const updateRating = asyncHandler(async (req, res) => {
  const { rating } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      message: 'Rating must be between 1 and 5'
    });
  }

  const service = await Service.findById(req.params.id);

  if (!service) {
    return res.status(404).json({
      success: false,
      message: 'Service not found'
    });
  }

  await Service.updateRating(req.params.id, rating);

  const updatedService = await Service.findById(req.params.id);

  res.json({
    success: true,
    message: 'Rating updated successfully',
    data: {
      service: updatedService
    }
  });
});

module.exports = {
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
};

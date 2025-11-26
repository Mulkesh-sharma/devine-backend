const { body, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// User registration validation
const validateUserRegistration = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 50 })
    .withMessage('Name cannot exceed 50 characters'),

  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

  body('phone')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please enter a valid 10-digit phone number starting with 6-9'),

  handleValidationErrors
];

// User login validation
const validateUserLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),

  handleValidationErrors
];

// Service creation/update validation
const validateService = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Service title is required')
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Service description is required')
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),

  body('shortDescription')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Short description cannot exceed 200 characters'),

  body('durationMinutes')
    .isInt({ min: 15 })
    .withMessage('Duration must be at least 15 minutes'),

  body('duration')
    .trim()
    .notEmpty()
    .withMessage('Duration text is required'),

  body('priceINR')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),

  body('location')
    .trim()
    .notEmpty()
    .withMessage('Location is required'),

  body('pujaLanguage')
    .trim()
    .notEmpty()
    .withMessage('Language is required'),

  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required'),

  body('difficulty')
    .optional()
    .isIn(['Easy', 'Medium', 'Hard'])
    .withMessage('Difficulty must be Easy, Medium, or Hard'),

  body('benefits')
    .optional()
    .isArray()
    .withMessage('Benefits must be an array'),

  body('benefits.*')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Each benefit cannot exceed 500 characters'),

  body('panditDetails')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Pandit details cannot exceed 1000 characters'),

  body('materials')
    .optional()
    .isArray()
    .withMessage('Materials must be an array'),

  body('materials.*')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Each material cannot exceed 200 characters'),

  body('procedure')
    .optional()
    .isArray()
    .withMessage('Procedure must be an array'),

  body('procedure.*')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Each procedure step cannot exceed 500 characters'),

  body('included')
    .optional()
    .isArray()
    .withMessage('Included items must be an array'),

  body('included.*')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Each included item cannot exceed 200 characters'),

  body('excluded')
    .optional()
    .isArray()
    .withMessage('Excluded items must be an array'),

  body('excluded.*')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Each excluded item cannot exceed 200 characters'),

  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),

  body('tags.*')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Each tag cannot exceed 50 characters'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),

  body('isPopular')
    .optional()
    .isBoolean()
    .withMessage('isPopular must be a boolean'),

  handleValidationErrors
];

// Booking creation validation
const validateBooking = [
  body('service')
    .notEmpty()
    .withMessage('Service ID is required')
    .isMongoId()
    .withMessage('Invalid service ID'),

  body('bookingDate')
    .isISO8601()
    .withMessage('Please provide a valid date')
    .custom((value) => {
      const date = new Date(value);
      const now = new Date();
      if (date <= now) {
        throw new Error('Booking date must be in the future');
      }
      return true;
    }),

  body('bookingTime')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Please enter a valid time in HH:MM format'),

  // Address validation
  body('address.street')
    .trim()
    .notEmpty()
    .withMessage('Street address is required')
    .isLength({ max: 200 })
    .withMessage('Street address cannot exceed 200 characters'),

  body('address.city')
    .trim()
    .notEmpty()
    .withMessage('City is required')
    .isLength({ max: 50 })
    .withMessage('City cannot exceed 50 characters'),

  body('address.state')
    .trim()
    .notEmpty()
    .withMessage('State is required')
    .isLength({ max: 50 })
    .withMessage('State cannot exceed 50 characters'),

  body('address.pincode')
    .matches(/^\d{6}$/)
    .withMessage('Please enter a valid 6-digit pincode'),

  body('address.landmark')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Landmark cannot exceed 100 characters'),

  // Contact person validation
  body('contactPerson.name')
    .trim()
    .notEmpty()
    .withMessage('Contact person name is required')
    .isLength({ max: 50 })
    .withMessage('Name cannot exceed 50 characters'),

  body('contactPerson.phone')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please enter a valid 10-digit phone number'),

  body('contactPerson.email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email'),

  // Pooja details validation
  body('poojaDetails.numberOfPeople')
    .isInt({ min: 1, max: 100 })
    .withMessage('Number of people must be between 1 and 100'),

  body('poojaDetails.specialInstructions')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Special instructions cannot exceed 500 characters'),

  body('poojaDetails.preferredPandit')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Preferred pandit name cannot exceed 100 characters'),

  body('poojaDetails.materialsProvided')
    .optional()
    .isBoolean()
    .withMessage('Materials provided must be a boolean'),

  // Pricing validation
  body('pricing.basePrice')
    .isFloat({ min: 0 })
    .withMessage('Base price must be a positive number'),

  body('pricing.additionalCharges')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Additional charges must be a positive number'),

  body('pricing.paymentMethod')
    .isIn(['cash', 'online', 'upi', 'card'])
    .withMessage('Please select a valid payment method'),

  handleValidationErrors
];

// User profile update validation
const validateUserUpdate = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ max: 50 })
    .withMessage('Name cannot exceed 50 characters'),

  body('phone')
    .optional()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please enter a valid 10-digit phone number'),

  handleValidationErrors
];

// Review validation
const validateReview = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),

  body('review')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Review cannot exceed 500 characters'),

  handleValidationErrors
];

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateService,
  validateBooking,
  validateUserUpdate,
  validateReview,
  handleValidationErrors
};
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: [true, 'Service is required']
  },
  // Required booking details
  bookingDate: {
    type: Date,
    required: [true, 'Booking date is required'],
    min: [new Date(), 'Booking date cannot be in the past']
  },
  bookingTime: {
    type: String,
    required: [true, 'Booking time is required'],
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time in HH:MM format']
  },
  // Address details for pooja
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required'],
      maxlength: [200, 'Street address cannot exceed 200 characters']
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      maxlength: [50, 'City cannot exceed 50 characters']
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      maxlength: [50, 'State cannot exceed 50 characters']
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      match: [/^\d{6}$/, 'Please enter a valid 6-digit pincode']
    },
    landmark: {
      type: String,
      maxlength: [100, 'Landmark cannot exceed 100 characters']
    }
  },
  // Contact person details
  contactPerson: {
    name: {
      type: String,
      required: [true, 'Contact person name is required'],
      maxlength: [50, 'Name cannot exceed 50 characters']
    },
    phone: {
      type: String,
      required: [true, 'Contact person phone is required'],
      match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit phone number']
    },
    email: {
      type: String,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    }
  },
  // Additional pooja details
  poojaDetails: {
    numberOfPeople: {
      type: Number,
      required: [true, 'Number of people is required'],
      min: [1, 'Number of people must be at least 1'],
      max: [100, 'Number of people cannot exceed 100']
    },
    specialInstructions: {
      type: String,
      maxlength: [500, 'Special instructions cannot exceed 500 characters']
    },
    preferredPandit: {
      type: String,
      maxlength: [100, 'Preferred pandit name cannot exceed 100 characters']
    },
    materialsProvided: {
      type: Boolean,
      default: false
    }
  },
  // Pricing details
  pricing: {
    basePrice: {
      type: Number,
      required: [true, 'Base price is required'],
      min: [0, 'Base price cannot be negative']
    },
    additionalCharges: {
      type: Number,
      default: 0,
      min: [0, 'Additional charges cannot be negative']
    },
    totalPrice: {
      type: Number,
      required: [true, 'Total price is required'],
      min: [0, 'Total price cannot be negative']
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'online', 'upi', 'card'],
      required: [true, 'Payment method is required']
    }
  },
  // Status and tracking
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'scheduled', 'in_progress', 'completed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  panditAssigned: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Feedback and rating
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  review: {
    type: String,
    maxlength: [500, 'Review cannot exceed 500 characters']
  },
  // Admin notes
  adminNotes: {
    type: String,
    maxlength: [500, 'Admin notes cannot exceed 500 characters']
  },
  // Cancellation details
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancellationReason: {
    type: String,
    maxlength: [500, 'Cancellation reason cannot exceed 500 characters']
  },
  cancellationDate: Date,
  // Rescheduling
  rescheduleCount: {
    type: Number,
    default: 0
  },
  lastRescheduleDate: Date,
  // Communication
  communications: [{
    type: {
      type: String,
      enum: ['email', 'sms', 'call', 'whatsapp'],
      required: true
    },
    message: {
      type: String,
      required: true
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'failed'],
      default: 'sent'
    }
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
bookingSchema.index({ user: 1, status: 1 });
bookingSchema.index({ service: 1, bookingDate: 1 });
bookingSchema.index({ status: 1, bookingDate: 1 });
bookingSchema.index({ panditAssigned: 1, bookingDate: 1 });

// Virtual for formatted booking datetime
bookingSchema.virtual('bookingDateTime').get(function() {
  if (this.bookingDate && this.bookingTime) {
    const date = new Date(this.bookingDate);
    const [hours, minutes] = this.bookingTime.split(':');
    date.setHours(parseInt(hours), parseInt(minutes));
    return date;
  }
  return null;
});

// Pre-save hook to calculate total price
bookingSchema.pre('save', function(next) {
  if (this.isModified('pricing.basePrice') || this.isModified('pricing.additionalCharges')) {
    this.pricing.totalPrice = this.pricing.basePrice + this.pricing.additionalCharges;
  }
  next();
});

// Method to check if booking can be cancelled
bookingSchema.methods.canBeCancelled = function() {
  const now = new Date();
  const bookingDateTime = this.bookingDateTime;
  if (!bookingDateTime) return false;
  
  const hoursDiff = (bookingDateTime - now) / (1000 * 60 * 60);
  return hoursDiff > 24 && ['pending', 'confirmed', 'scheduled'].includes(this.status);
};

// Method to check if booking can be rescheduled
bookingSchema.methods.canBeRescheduled = function() {
  const now = new Date();
  const bookingDateTime = this.bookingDateTime;
  if (!bookingDateTime) return false;
  
  const hoursDiff = (bookingDateTime - now) / (1000 * 60 * 60);
  return hoursDiff > 24 && this.rescheduleCount < 2 && ['pending', 'confirmed', 'scheduled'].includes(this.status);
};

module.exports = mongoose.model('Booking', bookingSchema);

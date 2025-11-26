const mongoose = require('mongoose');

const generateSlug = (title) =>
  title
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const serviceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Service title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  slug: {
    type: String,
    unique: true,
    index: true
  },
  description: {
    type: String,
    required: [true, 'Service description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [200, 'Short description cannot exceed 200 characters']
  },
  image: {
    type: String,
    default: ''
  },
  images: [{
    type: String
  }],
  imagePublicId: {
    type: String,
    default: ''
  },
  galleryPublicIds: [{
    type: String
  }],
  durationMinutes: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [15, 'Duration must be at least 15 minutes']
  },
  duration: {
    type: String,
    required: [true, 'Duration text is required']
  },
  priceINR: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  location: {
    type: String,
    required: [true, 'Location is required']
  },
  pujaLanguage: {
    type: String,
    required: [true, 'Language is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required']
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Easy'
  },
  benefits: [{
    type: String,
    maxlength: [500, 'Benefit cannot exceed 500 characters']
  }],
  panditDetails: {
    type: String,
    maxlength: [1000, 'Pandit details cannot exceed 1000 characters']
  },
  materials: [{
    type: String,
    maxlength: [200, 'Material cannot exceed 200 characters']
  }],
  procedure: [{
    type: String,
    maxlength: [500, 'Procedure step cannot exceed 500 characters']
  }],
  included: [{
    type: String,
    maxlength: [200, 'Included item cannot exceed 200 characters']
  }],
  excluded: [{
    type: String,
    maxlength: [200, 'Excluded item cannot exceed 200 characters']
  }],
  tags: [{
    type: String,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  bookingCount: {
    type: Number,
    default: 0
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for search functionality
serviceSchema.index({ title: 'text', description: 'text', category: 'text', tags: 'text' });

serviceSchema.pre('validate', function (next) {
  if (!this.slug && this.title) {
    this.slug = generateSlug(this.title);
  }

  if (this.isModified('title')) {
    this.slug = generateSlug(this.title);
  }

  next();
});

// Ensure slug uniqueness by appending counter if needed
serviceSchema.pre('save', async function (next) {
  if (!this.isModified('slug')) {
    return next();
  }

  const baseSlug = this.slug;
  let slug = baseSlug;
  let counter = 1;

  while (await this.constructor.findOne({ slug, _id: { $ne: this._id } })) {
    slug = `${baseSlug}-${counter++}`;
  }

  this.slug = slug;
  next();
});

// Update booking count when booking is created
serviceSchema.statics.incrementBookingCount = async function (serviceId) {
  return await this.findByIdAndUpdate(serviceId, { $inc: { bookingCount: 1 } });
};

// Get booking count for a service
serviceSchema.statics.getBookingCount = async function (serviceId) {
  const service = await this.findById(serviceId, { bookingCount: 1 });
  return service?.bookingCount ?? 0;
};

// Update rating
serviceSchema.statics.updateRating = async function (serviceId) {
  const Booking = mongoose.model('Booking');
  const bookings = await Booking.find({
    service: serviceId,
    status: 'completed',
    rating: { $exists: true }
  });

  if (bookings.length > 0) {
    const totalRating = bookings.reduce((sum, booking) => sum + booking.rating, 0);
    const avgRating = totalRating / bookings.length;

    return await this.findByIdAndUpdate(serviceId, {
      rating: {
        average: avgRating,
        count: bookings.length
      }
    });
  }
};

module.exports = mongoose.model('Service', serviceSchema);
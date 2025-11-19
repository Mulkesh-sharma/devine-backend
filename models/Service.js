const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Service title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
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
    required: [true, 'Language is required'],
    enum: ['Hindi', 'English', 'Sanskrit', 'Tamil', 'Telugu', 'Marathi', 'Gujarati', 'Bengali', 'Kannada', 'Malayalam', 'Punjabi']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Ganesh Pooja', 'Satyanarayan Katha', 'Laxmi Pooja', 'Rudra Abhishek', 'Navagraha Shanti', 'Vastu Shanti', 'Griha Pravesh', 'Marriage Ceremony', 'Naming Ceremony', 'Last Rites', 'Other']
  },
  difficulty: {
    type: String,
    enum: ['Simple', 'Moderate', 'Complex'],
    default: 'Simple'
  },
  benefits: [{
    type: String,
    maxlength: [200, 'Benefit cannot exceed 200 characters']
  }],
  panditDetails: {
    type: String,
    maxlength: [1000, 'Pandit details cannot exceed 1000 characters']
  },
  materials: [{
    type: String,
    maxlength: [100, 'Material cannot exceed 100 characters']
  }],
  procedure: [{
    type: String,
    maxlength: [300, 'Procedure step cannot exceed 300 characters']
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

// Update booking count when booking is created
serviceSchema.statics.incrementBookingCount = async function(serviceId) {
  return await this.findByIdAndUpdate(serviceId, { $inc: { bookingCount: 1 } });
};

// Update rating
serviceSchema.statics.updateRating = async function(serviceId) {
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
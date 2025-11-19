# Devine Rituals Backend API

Backend API for Devine Rituals - Spiritual Services Booking Platform

## Features

- **User Authentication**: JWT-based authentication with role-based access control
- **Service Management**: CRUD operations for spiritual services (admin only)
- **Booking System**: Complete booking workflow with status management
- **User Management**: Admin controls for user management
- **Email Notifications**: Automated email notifications for bookings
- **Database**: MongoDB with Mongoose ODM
- **Validation**: Comprehensive input validation
- **Error Handling**: Robust error handling and logging

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **nodemailer** - Email services
- **helmet** - Security middleware

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your configuration:
   ```
   PORT=5000
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/Devine
   JWT_SECRET=your_jwt_secret_here
   JWT_EXPIRE=30d
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   ```

4. Run the seeder to populate initial data:
   ```bash
   npm run seed
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/create-admin` - Create admin user
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/password` - Change password

### Services (Public)
- `GET /api/services` - Get all services
- `GET /api/services/popular` - Get popular services
- `GET /api/services/category/:category` - Get services by category
- `GET /api/services/:id` - Get single service

### Services (Admin Only)
- `POST /api/services` - Create new service
- `PUT /api/services/:id` - Update service
- `DELETE /api/services/:id` - Delete service
- `PATCH /api/services/:id/toggle-popular` - Toggle popularity

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - Get bookings (user's own or all for admin)
- `GET /api/bookings/:id` - Get single booking
- `PATCH /api/bookings/:id/status` - Update booking status (admin only)
- `PATCH /api/bookings/:id/cancel` - Cancel booking
- `PATCH /api/bookings/:id/reschedule` - Reschedule booking
- `PATCH /api/bookings/:id/review` - Add review
- `PATCH /api/bookings/:id/assign-pandit` - Assign pandit (admin only)

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user profile (admin or self)
- `PUT /api/users/:id` - Update user (admin or self)
- `DELETE /api/users/:id` - Delete user (admin only)
- `PATCH /api/users/:id/toggle-active` - Toggle user active status (admin only)
- `GET /api/users/stats` - Get user statistics (admin only)
- `GET /api/users/:id/bookings` - Get user bookings (admin or self)

### Health Check
- `GET /api/health` - Server health check

## Default Admin User

After running the seeder, a default admin user is created:
- **Email**: admin@devinerituals.com
- **Password**: Admin123

## Data Models

### User
```javascript
{
  name: String,
  email: String,
  password: String (hashed),
  phone: String,
  role: String ('user' | 'admin'),
  isActive: Boolean,
  profilePicture: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Service
```javascript
{
  name: String,
  description: String,
  category: String,
  price: Number,
  duration: Number (minutes),
  image: String,
  requirements: [String],
  benefits: [String],
  language: [String],
  isPopular: Boolean,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Booking
```javascript
{
  user: ObjectId (ref: 'User'),
  service: ObjectId (ref: 'Service'),
  bookingDate: Date,
  preferredTime: String,
  address: String,
  city: String,
  state: String,
  pincode: String,
  phone: String,
  status: String ('pending' | 'confirmed' | 'completed' | 'cancelled'),
  paymentStatus: String ('pending' | 'paid' | 'refunded'),
  totalAmount: Number,
  specialRequests: String,
  assignedPandit: ObjectId (ref: 'User'),
  review: {
    rating: Number,
    comment: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

## Error Handling

All API responses follow a consistent format:

### Success Response
```javascript
{
  success: true,
  message: "Operation successful",
  data: {...},
  pagination: {...} // for paginated endpoints
}
```

### Error Response
```javascript
{
  success: false,
  message: "Error description",
  errors: [...] // for validation errors
}
```

## Security Features

- JWT authentication with expiration
- Password hashing with bcryptjs
- Role-based access control
- Input validation and sanitization
- CORS configuration
- Helmet security headers
- Rate limiting (can be added)

## Development

### Running Tests
```bash
npm test
```

### Database Seeding
```bash
npm run seed
```

### Environment Variables
Make sure to set up the following environment variables:
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for JWT token signing
- `JWT_EXPIRE` - JWT token expiration time
- `EMAIL_*` - Email configuration for notifications

## Deployment

1. Set production environment variables
2. Install production dependencies
3. Build the application (if applicable)
4. Start the server:
   ```bash
   npm start
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the ISC License.

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Service = require('../models/Service');

// Load env vars
dotenv.config();

// Connect to DB
mongoose.connect(process.env.MONGODB_URI);

// Sample services data
const services = [
  {
    title: 'Satyanarayan Katha',
    description: 'A traditional puja performed to seek blessings from Lord Vishnu for prosperity and well-being.',
    category: 'Satyanarayan Katha',
    priceINR: 2500,
    durationMinutes: 120,
    duration: '2 hours',
    location: 'At your location',
    pujaLanguage: 'Hindi',
    images: ['https://example.com/satyanarayan.jpg'],
    requirements: [
      'Kalash (water vessel)',
      'Flowers and fruits',
      'Coconut',
      'Incense sticks',
      'Prasad ingredients'
    ],
    benefits: [
      'Brings prosperity and wealth',
      'Removes obstacles',
      'Blessings for family well-being',
      'Success in new ventures'
    ],
    tags: ['traditional', 'prosperity', 'family'],
    difficulty: 'Moderate',
    isPopular: true,
    isActive: true,
    createdBy: null // Will be set after admin creation
  },
  {
    title: 'Ganesh Pooja',
    description: 'Worship of Lord Ganesha to remove obstacles and seek success in all endeavors.',
    category: 'Ganesh Pooja',
    priceINR: 1500,
    durationMinutes: 90,
    duration: '1.5 hours',
    location: 'At your location',
    pujaLanguage: 'Hindi',
    images: ['https://example.com/ganesh.jpg'],
    requirements: [
      'Ganesh idol',
      'Modak (sweet)',
      'Durva grass',
      'Flowers',
      'Incense sticks'
    ],
    benefits: [
      'Removes obstacles',
      'Brings success',
      'Wisdom and knowledge',
      'New beginnings'
    ],
    tags: ['traditional', 'success', 'wisdom'],
    difficulty: 'Simple',
    isPopular: true,
    isActive: true,
    createdBy: null // Will be set after admin creation
  },
  {
    title: 'Laxmi Pooja',
    description: 'Goddess Lakshmi worship for wealth, fortune, and prosperity.',
    category: 'Laxmi Pooja',
    priceINR: 3000,
    durationMinutes: 150,
    duration: '2.5 hours',
    location: 'At your location',
    pujaLanguage: 'Hindi',
    images: ['https://example.com/lakshmi.jpg'],
    requirements: [
      'Lakshmi idol',
      'Silver coins',
      'Lotus flowers',
      'Sweets',
      'Lamps (diyas)'
    ],
    benefits: [
      'Wealth and prosperity',
      'Financial stability',
      'Success in business',
      'Abundance in life'
    ],
    tags: ['prosperity', 'wealth', 'business'],
    difficulty: 'Moderate',
    isPopular: true,
    isActive: true,
    createdBy: null // Will be set after admin creation
  },
  {
    title: 'Rudra Abhishek',
    description: 'Powerful Shiva puja performed with sacred water, milk, and other offerings.',
    category: 'Rudra Abhishek',
    priceINR: 5000,
    durationMinutes: 180,
    duration: '3 hours',
    location: 'At your location',
    pujaLanguage: 'Sanskrit',
    images: ['https://example.com/rudra.jpg'],
    requirements: [
      'Shivling',
      'Bel patra',
      'Milk, honey, yogurt',
      'Gangajal',
      'Bhasma'
    ],
    benefits: [
      'Spiritual purification',
      'Removes negative energy',
      'Inner peace',
      'Spiritual growth'
    ],
    tags: ['spiritual', 'purification', 'peace'],
    difficulty: 'Complex',
    isPopular: false,
    isActive: true,
    createdBy: null // Will be set after admin creation
  },
  {
    title: 'Navagraha Shanti',
    description: 'Puja to appease the nine celestial bodies for astrological benefits.',
    category: 'Navagraha Shanti',
    priceINR: 4000,
    durationMinutes: 200,
    duration: '3.3 hours',
    location: 'At your location',
    pujaLanguage: 'Sanskrit',
    images: ['https://example.com/navagraha.jpg'],
    requirements: [
      'Navagraha idols',
      'Nine types of grains',
      'Colorful clothes',
      'Sesame oil',
      'Jaggery'
    ],
    benefits: [
      'Reduces malefic effects',
      'Brings good fortune',
      'Harmonizes planetary influences',
      'Overall well-being'
    ],
    tags: ['astrological', 'fortune', 'wellness'],
    difficulty: 'Complex',
    isPopular: false,
    isActive: true,
    createdBy: null // Will be set after admin creation
  },
  {
    title: 'Griha Pravesh',
    description: 'House warming ceremony to bless the new home with positive energy.',
    category: 'Griha Pravesh',
    priceINR: 3500,
    durationMinutes: 160,
    duration: '2.6 hours',
    location: 'At your location',
    pujaLanguage: 'Hindi',
    images: ['https://example.com/griha.jpg'],
    requirements: [
      'Kalash',
      'Mango leaves',
      'Coconut',
      'Rice',
      'Flowers'
    ],
    benefits: [
      'Blesses the new home',
      'Removes negative energy',
      'Brings prosperity',
      'Family well-being'
    ],
    tags: ['ceremony', 'home', 'blessing'],
    difficulty: 'Moderate',
    isPopular: true,
    isActive: true,
    createdBy: null // Will be set after admin creation
  }
];

// Seed data
const seedData = async () => {
  try {
    // Clear existing data
    await Service.deleteMany();
    await User.deleteMany({ role: 'admin' });

    console.log('Data cleared...');

    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@devinerituals.com',
      password: 'Admin123',
      phone: '9876543210',
      role: 'admin'
    });

    console.log('Admin user created:', admin.email);

    // Set createdBy for all services
    services.forEach(service => {
      service.createdBy = admin._id;
    });

    // Create services
    const createdServices = await Service.insertMany(services);
    console.log(`${createdServices.length} services created`);

    console.log('Seeding completed successfully!');
    process.exit();
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

// Run seeder
seedData();
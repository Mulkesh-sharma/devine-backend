const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const EmailOtp = require('../models/EmailOtp');
const sendEmail = require('../utils/sendEmail');
const { asyncHandler } = require('../middleware/errorHandler');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// @desc    Register user (Step 1: Send OTP)
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  // Validate input
  if (!name || !email || !password || !phone) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields'
    });
  }

  // Check if user exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({
      success: false,
      message: 'User already exists'
    });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Save OTP to database (upsert to handle re-registration attempts)
  await EmailOtp.findOneAndUpdate(
    { email },
    { otp, createdAt: Date.now() },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Send OTP email
  const message = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #ea580c;">Verify Your Email</h2>
      <p>Your verification code is:</p>
      <h1 style="font-size: 32px; letter-spacing: 5px; background: #f3f4f6; padding: 10px; text-align: center; border-radius: 5px;">${otp}</h1>
      <p>This code is valid for 5 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
    </div>
  `;

  try {
    await sendEmail({
      email,
      subject: 'Devine Rituals - Email Verification',
      html: message
    });

    res.status(200).json({
      success: true,
      message: `Verification code sent to ${email}`
    });
  } catch (error) {
    console.error(error);
    await EmailOtp.deleteOne({ email });
    return res.status(500).json({
      success: false,
      message: 'Email could not be sent'
    });
  }
});

// @desc    Verify OTP and Create User (Step 2: Verify & Create)
// @route   POST /api/auth/verify
// @access  Public
const verifyEmail = asyncHandler(async (req, res) => {
  const { email, otp, name, password, phone } = req.body;

  if (!email || !otp || !name || !password || !phone) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields including OTP'
    });
  }

  // Check OTP
  const otpRecord = await EmailOtp.findOne({ email });

  if (!otpRecord) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired OTP'
    });
  }

  if (otpRecord.otp !== otp) {
    return res.status(400).json({
      success: false,
      message: 'Invalid OTP'
    });
  }

  // Check if user already exists (double check)
  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({
      success: false,
      message: 'User already exists'
    });
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    phone
  });

  // Delete OTP record
  await EmailOtp.deleteOne({ email });

  // Generate token
  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: user.getPublicProfile(),
      token
    }
  });
});

// @desc    Resend OTP
// @route   POST /api/auth/resend
// @access  Public
const resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email'
    });
  }

  // Check if user already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({
      success: false,
      message: 'User already exists. Please login.'
    });
  }

  // Generate new OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Update OTP in database
  await EmailOtp.findOneAndUpdate(
    { email },
    { otp, createdAt: Date.now() },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Send OTP email
  const message = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #ea580c;">Verify Your Email</h2>
      <p>Your new verification code is:</p>
      <h1 style="font-size: 32px; letter-spacing: 5px; background: #f3f4f6; padding: 10px; text-align: center; border-radius: 5px;">${otp}</h1>
      <p>This code is valid for 5 minutes.</p>
    </div>
  `;

  try {
    await sendEmail({
      email,
      subject: 'Devine Rituals - New Verification Code',
      html: message
    });

    res.status(200).json({
      success: true,
      message: `New verification code sent to ${email}`
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Email could not be sent'
    });
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password'
    });
  }

  // Check for user
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Check if password matches
  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Check if user is active
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Account is deactivated'
    });
  }

  // Generate token
  const token = generateToken(user._id);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: user.getPublicProfile(),
      token
    }
  });
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  res.json({
    success: true,
    data: {
      user: user.getPublicProfile()
    }
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, avatar } = req.body;

  const user = await User.findById(req.user.id);

  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (avatar) user.avatar = avatar;

  await user.save();

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: user.getPublicProfile()
    }
  });
});

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Please provide current password and new password'
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'New password must be at least 6 characters long'
    });
  }

  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  const isMatch = await user.comparePassword(currentPassword);

  if (!isMatch) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

// @desc    Create admin user (for initial setup)
// @route   POST /api/auth/create-admin
// @access  Public (should be protected in production)
const createAdmin = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  // Check if user exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({
      success: false,
      message: 'User already exists'
    });
  }

  // Create admin user
  const user = await User.create({
    name,
    email,
    password,
    phone,
    role: 'admin'
  });

  // Generate token
  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    message: 'Admin user created successfully',
    data: {
      user: user.getPublicProfile(),
      token
    }
  });
});

module.exports = {
  register,
  verifyEmail,
  resendOtp,
  login,
  getMe,
  updateProfile,
  changePassword,
  createAdmin
};
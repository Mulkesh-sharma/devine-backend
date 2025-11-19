const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Create transporter
  const transporter = nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Define email options
  const mailOptions = {
    from: `${process.env.EMAIL_USER}`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  // Send email
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.messageId);
    return info;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

// Send booking confirmation email
const sendBookingConfirmation = async (booking, user) => {
  const message = `
    <h2>Booking Confirmation</h2>
    <p>Dear ${user.name},</p>
    <p>Your booking has been confirmed! Here are the details:</p>
    <ul>
      <li><strong>Service:</strong> ${booking.service.name}</li>
      <li><strong>Date:</strong> ${new Date(booking.bookingDate).toLocaleDateString()}</li>
      <li><strong>Time:</strong> ${booking.preferredTime}</li>
      <li><strong>Location:</strong> ${booking.address}</li>
      <li><strong>Status:</strong> ${booking.status}</li>
    </ul>
    <p>Thank you for choosing Devine Rituals!</p>
  `;

  await sendEmail({
    email: user.email,
    subject: 'Booking Confirmation - Devine Rituals',
    html: message,
  });
};

// Send booking status update email
const sendBookingStatusUpdate = async (booking, user) => {
  const message = `
    <h2>Booking Status Update</h2>
    <p>Dear ${user.name},</p>
    <p>Your booking status has been updated to: <strong>${booking.status}</strong></p>
    <ul>
      <li><strong>Service:</strong> ${booking.service.name}</li>
      <li><strong>Date:</strong> ${new Date(booking.bookingDate).toLocaleDateString()}</li>
      <li><strong>Time:</strong> ${booking.preferredTime}</li>
    </ul>
    <p>Thank you for choosing Devine Rituals!</p>
  `;

  await sendEmail({
    email: user.email,
    subject: 'Booking Status Update - Devine Rituals',
    html: message,
  });
};

module.exports = {
  sendEmail,
  sendBookingConfirmation,
  sendBookingStatusUpdate,
};
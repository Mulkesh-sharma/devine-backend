const streamifier = require('streamifier');
const cloudinary = require('../config/cloudinary');

const uploadBase64Image = (base64String, options = {}) => {
  return new Promise((resolve, reject) => {
    if (!base64String) {
      return resolve(null);
    }

    const matches = base64String.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
      return reject(new Error('Invalid base64 image string'));
    }

    const buffer = Buffer.from(matches[2], 'base64');
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || 'devine/services',
        resource_type: 'image',
        ...options,
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

const deleteAsset = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Failed to delete Cloudinary asset:', error);
  }
};

module.exports = {
  uploadBase64Image,
  deleteAsset,
};

import { v2 as cloudinary } from "cloudinary";
import multer from 'multer';
import dotenv from "dotenv";

dotenv.config();

// Check if Cloudinary credentials are available
const hasCloudinaryConfig = process.env.CLOUDINARY_CLOUD_NAME && 
                            process.env.CLOUDINARY_API_KEY && 
                            process.env.CLOUDINARY_API_SECRET;

if (hasCloudinaryConfig) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('✅ Cloudinary configured successfully');
} else {
  console.log('⚠️ Cloudinary credentials not found. Using placeholder service for images.');
}

// Configure multer for memory storage (files will be uploaded to Cloudinary directly)
const storage = multer.memoryStorage();

// Helper function to upload buffer to Cloudinary or return placeholder
export const uploadToCloudinary = (buffer, folder, resourceType = 'image') => {
  return new Promise((resolve, reject) => {
    // If Cloudinary is not configured, return a placeholder URL
    if (!hasCloudinaryConfig) {
      console.log('🖼️ Using placeholder image (Cloudinary not configured)');
      const placeholderUrl = `https://ui-avatars.com/api/?name=${folder.includes('photo') ? 'User' : 'Document'}&size=400&background=e5e7eb&color=6b7280`;
      resolve({ secure_url: placeholderUrl });
      return;
    }
    
    const uploadOptions = {
      folder: folder,
      resource_type: resourceType,
      transformation: [
        { width: 800, height: 600, crop: 'limit' },
        { quality: 'auto' }
      ]
    };

    cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    ).end(buffer);
  });
};

// Multer upload configuration for driver documents
export const uploadDriverDocuments = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images and PDFs
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and PDFs are allowed.'), false);
    }
  }
});

// Multer upload configuration for conductor documents
export const uploadConductorDocuments = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images and PDFs
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and PDFs are allowed.'), false);
    }
  }
});

export default cloudinary;
import multer from 'multer';
import { BadRequestError } from '../exceptions';

// Configure multer for memory storage (files stored in buffer)
const storage = multer.memoryStorage();

// File filter to accept only images
const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Accept images only
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new BadRequestError('Only image files are allowed'));
  }
};

// Configure multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

// Middleware for single file upload
export const uploadSingle = upload.single('file');

// Middleware for multiple files upload (max 10)
export const uploadMultiple = upload.array('files', 10);

// Middleware for handling multer errors
export const handleMulterError = (
  error: any,
  req: Express.Request,
  res: any,
  next: any
) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      throw new BadRequestError('File size too large. Max size is 10MB');
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      throw new BadRequestError('Too many files. Max 10 files allowed');
    }
    throw new BadRequestError(`Upload error: ${error.message}`);
  }
  next(error);
};

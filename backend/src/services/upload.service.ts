import { AppError } from '../utils/errors';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs/promises';

const UPLOAD_DIR = path.join(__dirname, '../../uploads/avatars');
const PUBLIC_URL = process.env.BACKEND_URL || 'http://localhost:4000';

export class UploadService {
  async uploadAvatar(file: Express.Multer.File, userId: string): Promise<string> {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new AppError('Invalid file type. Only JPEG, PNG, and WebP are allowed.', 400);
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new AppError('File size exceeds 5MB limit', 400);
    }

    try {
      // Create uploads directory if it doesn't exist
      await fs.mkdir(UPLOAD_DIR, { recursive: true });

      // Generate unique filename
      const fileExtension = path.extname(file.originalname);
      const fileName = `${userId}_${crypto.randomBytes(8).toString('hex')}${fileExtension}`;
      const filePath = path.join(UPLOAD_DIR, fileName);

      // Save file
      await fs.writeFile(filePath, file.buffer);

      // Return public URL
      return `${PUBLIC_URL}/uploads/avatars/${fileName}`;
    } catch (error) {
      console.error('File upload error:', error);
      throw new AppError('Failed to upload file', 500);
    }
  }
}

export const uploadService = new UploadService();
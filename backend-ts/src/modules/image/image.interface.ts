import { Document } from 'mongoose';

export interface IImage extends Document {
  originalUrl: string;
  cloudinaryPublicId: string;
  cloudinaryUrl: string;
  fileHash: string; // MD5 hash to detect duplicates
  fileName: string;
  fileSize: number;
  mimeType: string;
  width?: number;
  height?: number;
  format?: string;
  folder: string;
  
  // Reference counting for safe deletion
  refCount: number;
  usedBy: IImageUsage[];
  
  // Metadata
  uploadedBy: string; // User ID
  tags?: string[];
  description?: string;
  
  // Transformations cache
  transformations: IImageTransformation[];
  
  createdAt: Date;
  updatedAt: Date;
}

export interface IImageUsage {
  entityType: 'blog' | 'user' | 'information' | 'other';
  entityId: string;
  field: string; // which field uses this image (e.g., 'mainImage', 'gallery', 'avatar')
  addedAt: Date;
}

export interface IImageTransformation {
  name: string; // e.g., 'thumbnail', 'medium', 'large'
  url: string;
  width?: number;
  height?: number;
  transformation: string; // cloudinary transformation string
}

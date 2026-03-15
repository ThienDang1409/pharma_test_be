import mongoose, { Schema } from 'mongoose';
import { IImage, IImageUsage, IImageTransformation } from './image.interface';

const ImageUsageSchema = new Schema<IImageUsage>(
  {
    entityType: {
      type: String,
      enum: ['blog', 'user', 'information', 'other'],
      required: true,
    },
    entityId: {
      type: String,
      required: true,
      index: true,
    },
    field: {
      type: String,
      required: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const ImageTransformationSchema = new Schema<IImageTransformation>(
  {
    name: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    width: Number,
    height: Number,
    transformation: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const ImageSchema = new Schema<IImage>(
  {
    originalUrl: {
      type: String,
      required: true,
    },
    cloudinaryPublicId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    cloudinaryUrl: {
      type: String,
      required: true,
    },
    fileHash: {
      type: String,
      required: true,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    width: Number,
    height: Number,
    format: String,
    folder: {
      type: String,
      required: true,
      default: 'uploads',
      index: true,
    },
    refCount: {
      type: Number,
      default: 0,
      index: true,
    },
    usedBy: {
      type: [ImageUsageSchema],
      default: [],
    },
    uploadedBy: {
      type: String,
      required: true,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    description: String,
    transformations: {
      type: [ImageTransformationSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: 'images',
  }
);

// Compound indexes for better query performance
ImageSchema.index({ refCount: 1, createdAt: -1 });
ImageSchema.index({ uploadedBy: 1, createdAt: -1 });
ImageSchema.index({ folder: 1, createdAt: -1 });
ImageSchema.index({ 'usedBy.entityType': 1, 'usedBy.entityId': 1 });
ImageSchema.index({ tags: 1 });

// Text index for search
ImageSchema.index({ fileName: 'text', description: 'text', tags: 'text' });

export default mongoose.model<IImage>('Image', ImageSchema);

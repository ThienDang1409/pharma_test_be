import mongoose, { Schema } from 'mongoose';
import { IInformation } from './information.interface';

const InformationSchema = new Schema<IInformation>(
  {
    name: {
      type: String,
      required: [true, 'Vietnamese name is required'],
      trim: true,
    },
    name_en: {
      type: String,
      required: [true, 'English name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    description_en: {
      type: String,
      trim: true,
    },
    image: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Image',
      default: null,
    } as any,
    parentId: {
      type: String,
      default: null,
      index: true,
    },
    order: {
      type: Number,
      default: 0,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'informations',
  }
);

// Indexes for better query performance
InformationSchema.index({ parentId: 1, order: 1 });
InformationSchema.index({ slug: 1 });
InformationSchema.index({ isActive: 1 });

// Virtual populate for children
InformationSchema.virtual('children', {
  ref: 'Information',
  localField: '_id',
  foreignField: 'parentId',
});

// Transform output to include virtuals
InformationSchema.set('toJSON', { virtuals: true });
InformationSchema.set('toObject', { virtuals: true });

export default mongoose.model<IInformation>('Information', InformationSchema);

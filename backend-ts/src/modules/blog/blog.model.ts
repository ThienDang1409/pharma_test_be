import { Schema, model } from 'mongoose';
import mongoose from 'mongoose';
import { IBlog, ISection } from './blog.interface';

const SectionSchema = new Schema<ISection>(
  {
    title: { type: String, trim: true },
    title_en: { type: String },
    slug: { type: String, required: true },
    type: { type: String, required: true },
    content: { type: String, required: true },
    content_en: { type: String },
  },
  { _id: false }
);

const BlogSchema = new Schema<IBlog>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    title_en: {
      type: String,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    author: {
      type: String,
      default: 'Admin',
    },
    image: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Image',
      default: null,
    } as any,
    excerpt: {
      type: String,
      trim: true,
    },
    excerpt_en: {
      type: String,
      trim: true,
    },
    informationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Information',
      required: true,
    } as any,
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    sections: [SectionSchema],
    isProduct: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },
    publishedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Create virtual "id"
BlogSchema.virtual('id').get(function (this: any) {
  return this._id.toHexString();
});

// Indexes for query optimization
BlogSchema.index({ slug: 1 });
BlogSchema.index({ status: 1, createdAt: -1 });
BlogSchema.index({ informationId: 1 });
BlogSchema.index({ isProduct: 1 });

// Show virtuals when toJSON
BlogSchema.set('toJSON', {
  virtuals: true,
});

const Blog = model<IBlog>('Blog', BlogSchema);

export default Blog;

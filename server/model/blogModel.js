const mongoose = require('mongoose');

// Schema cho từng section trong blog
const SectionSchema = new mongoose.Schema({
  title: { type: String, required: true },  // ví dụ: "Description of ....", "Feature of ...."
  title_en: { type: String },               // Tiêu đề tiếng Anh
  slug: { type: String, required: true },   // ví dụ: "description"
  type: { type: String, required: true },   // ví dụ:"Description", "Feature", "Content"
  content: { type: String, required: true }, // HTML hoặc Markdown (VI)
  content_en: { type: String },             // HTML hoặc Markdown (EN)
}, { _id: false });

// Blog Schema chính
const BlogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  title_en: {
    type: String,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  author: {
    type: String,
    default: 'Admin'
  },
  image: {
    type: String,
    default: '/default-image.jpg'
  },
  excerpt: {
    type: String,
    trim: true
  },
  excerpt_en: {
    type: String,
    trim: true
  },
  informationId: { // liên kết đến bảng Information (danh mục)
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Information',
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  sections: [SectionSchema], // các phần nhỏ trong bài
  isProduct: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },
  publishedAt: {
    type: Date
  }
}, {
  timestamps: true // tự động thêm createdAt, updatedAt
});

// Tạo virtual "id"
BlogSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// Hiển thị virtuals khi toJSON
BlogSchema.set('toJSON', {
  virtuals: true
});

// Xuất model
const Blog = mongoose.model('Blog', BlogSchema);
module.exports = Blog;
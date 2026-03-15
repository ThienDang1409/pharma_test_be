# Image Management System

## 🎯 Tính năng chính

### ✅ Deduplication với Hash
- Mỗi file được tính MD5 hash
- Upload file trùng → tự động trả về ảnh đã có
- Tiết kiệm storage và bandwidth

### ✅ Reference Counting
- `refCount`: Đếm số lượng entity đang dùng ảnh
- `usedBy[]`: Tracking chi tiết (entityType, entityId, field)
- Không cho phép xóa nếu refCount > 0

### ✅ Auto-cleanup
- Khi refCount = 0 → tự động xóa khỏi Cloudinary + DB
- Có endpoint cleanup để dọn ảnh cũ không dùng

### ✅ Transformation thay vì re-upload
- Cloudinary transformation URL
- Cache transformations trong DB
- Không cần upload lại cho mỗi kích thước

### ✅ Complete Tracking
- uploadedBy: user ID
- tags, description
- createdAt, updatedAt
- width, height, format, fileSize

## 📡 API Endpoints

### Upload Images

**Upload Single Image**
```http
POST /api/images/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

Field: image (file)
Body: {
  "tags": ["blog", "featured"],
  "description": "Blog main image",
  "folder": "blog-images",
  "entityType": "blog",
  "entityId": "673abc123def",
  "field": "mainImage"
}

Response: {
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "image": {
      "_id": "674xyz...",
      "cloudinaryUrl": "https://res.cloudinary.com/...",
      "cloudinaryPublicId": "uploads/abc123",
      "fileName": "hero.jpg",
      "fileHash": "d41d8cd98f00b204e9800998ecf8427e",
      "refCount": 1,
      "usedBy": [{
        "entityType": "blog",
        "entityId": "673abc123def",
        "field": "mainImage",
        "addedAt": "2026-01-03T..."
      }],
      ...
    }
  }
}
```

**Upload Multiple Images**
```http
POST /api/images/upload-multiple
Authorization: Bearer {token}
Content-Type: multipart/form-data

Field: images (multiple files, max 10)
Body: {
  "tags": ["gallery"],
  "folder": "gallery"
}
```

### Query Images

**Get All Images with Filters**
```http
GET /api/images?page=1&limit=20&search=hero&tags=blog,featured&folder=uploads&unusedOnly=false
Authorization: Bearer {token}

Response: {
  "success": true,
  "data": {
    "images": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

**Get Images by Entity**
```http
GET /api/images/entity/blog/673abc123def
Authorization: Bearer {token}

# Returns all images used by this blog
```

**Get Image by ID**
```http
GET /api/images/674xyz...
Authorization: Bearer {token}
```

### Update Image

```http
PUT /api/images/674xyz...
Authorization: Bearer {token}
Content-Type: application/json

{
  "tags": ["blog", "updated"],
  "description": "Updated description"
}
```

### Reference Management

**Add Reference**
```http
POST /api/images/674xyz.../reference
Authorization: Bearer {token}
Content-Type: application/json

{
  "entityType": "blog",
  "entityId": "673abc123def",
  "field": "gallery"
}

# Increases refCount by 1
```

**Remove Reference**
```http
DELETE /api/images/674xyz.../reference
Authorization: Bearer {token}
Content-Type: application/json

{
  "entityType": "blog",
  "entityId": "673abc123def",
  "field": "gallery"
}

# Decreases refCount by 1
# If refCount reaches 0 → auto-delete from Cloudinary + DB
```

### Transformation

**Generate Transformation**
```http
POST /api/images/674xyz.../transform
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "thumbnail",
  "width": 200,
  "height": 200,
  "crop": "fill",
  "quality": 80,
  "format": "webp",
  "gravity": "auto"
}

Response: {
  "success": true,
  "message": "Transformation generated successfully",
  "data": {
    "url": "https://res.cloudinary.com/.../w_200,h_200,c_fill,q_80,f_webp/..."
  }
}
```

**Available Transformations:**
- `crop`: fill, fit, scale, limit, pad, thumb
- `format`: jpg, png, webp, avif
- `gravity`: auto, face, center, north, south, east, west
- `quality`: 1-100

### Admin Operations

**Delete Image (Admin only)**
```http
DELETE /api/images/674xyz...
Authorization: Bearer {admin_token}

# Only works if refCount = 0
# Otherwise returns error
```

**Cleanup Unused Images (Admin only)**
```http
POST /api/images/cleanup?daysOld=30
Authorization: Bearer {admin_token}

# Deletes all images with refCount=0 older than 30 days
```

## 💻 Usage in Code

### Example: Blog Service Integration

```typescript
import { addImageReferences, removeImageReferences, updateImageReferences } from '../common/utils/imageHelper';

// When creating a blog
async createBlog(data: CreateBlogDto, userId: string) {
  const blog = await Blog.create({...data, author: userId});
  
  // Add references for blog images
  const imageIds = [data.mainImage, ...data.gallery];
  await addImageReferences(imageIds, 'blog', blog._id.toString(), 'images');
  
  return blog;
}

// When updating a blog
async updateBlog(id: string, data: UpdateBlogDto) {
  const blog = await Blog.findById(id);
  
  const oldImages = [blog.mainImage, ...blog.gallery];
  const newImages = [data.mainImage, ...data.gallery];
  
  // Automatically handle image reference changes
  await updateImageReferences(oldImages, newImages, 'blog', id, 'images');
  
  Object.assign(blog, data);
  await blog.save();
  
  return blog;
}

// When deleting a blog
async deleteBlog(id: string) {
  const blog = await Blog.findById(id);
  
  const imageIds = [blog.mainImage, ...blog.gallery];
  
  // Remove all references - images with refCount=0 auto-delete
  await removeImageReferences(imageIds, 'blog', id);
  
  await blog.deleteOne();
}
```

### Frontend Upload Flow

```typescript
// 1. Upload image first
const formData = new FormData();
formData.append('image', file);
formData.append('tags', JSON.stringify(['blog']));
formData.append('folder', 'blog-images');

const uploadRes = await fetch('/api/images/upload', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});

const { data } = await uploadRes.json();
const imageId = data.image._id;

// 2. Create blog with image ID
const blogRes = await fetch('/api/blog', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'My Blog',
    mainImage: imageId,  // Use image ID from upload
    ...
  })
});
```

## 🔧 Configuration

### .env Setup
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Get Cloudinary Credentials
1. Sign up at https://cloudinary.com
2. Dashboard → API Keys
3. Copy: Cloud Name, API Key, API Secret

## 🎨 Transformation Presets

Common transformations you can define:

```typescript
// Thumbnail
{ name: 'thumbnail', width: 150, height: 150, crop: 'fill' }

// Medium
{ name: 'medium', width: 800, height: 600, crop: 'fit' }

// Hero
{ name: 'hero', width: 1920, height: 1080, crop: 'fill', quality: 90 }

// Avatar
{ name: 'avatar', width: 100, height: 100, crop: 'thumb', gravity: 'face' }

// Optimized WebP
{ name: 'webp-opt', format: 'webp', quality: 80 }
```

## 📊 Monitoring & Maintenance

**Check unused images:**
```http
GET /api/images?unusedOnly=true
```

**Check images by folder:**
```http
GET /api/images?folder=uploads
```

**Check images by user:**
```http
GET /api/images?uploadedBy=USER_ID
```

**Run cleanup job (cron recommended):**
```typescript
// Schedule with node-cron
import cron from 'node-cron';
import { ImageService } from './modules/image/image.service';

const imageService = new ImageService();

// Run cleanup every Sunday at 3 AM
cron.schedule('0 3 * * 0', async () => {
  const deleted = await imageService.cleanupUnusedImages(30);
  console.log(`Cleaned up ${deleted} unused images`);
});
```

## 🚀 Benefits

1. **Storage Optimization**: No duplicate files
2. **Safe Deletion**: Can't delete images in use
3. **Auto-cleanup**: Orphaned images removed automatically
4. **Performance**: Transformations cached
5. **Tracking**: Know exactly where each image is used
6. **Scalability**: Ready for large projects
7. **Frontend-friendly**: Simple upload flow
8. **Cost-effective**: Cloudinary free tier handles 25GB

## ⚠️ Important Notes

- Always upload images BEFORE creating entities that reference them
- Don't delete images manually from Cloudinary - use API
- Set up proper Cloudinary upload presets for security
- Consider enabling Cloudinary auto-moderation for user uploads
- Monitor storage usage in Cloudinary dashboard

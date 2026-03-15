# 📊 Image Management - Chi tiết Workflow & Scenarios

## 1️⃣ **WORKFLOW CƠ BẢN**

### **Flowchart Upload → Reference → Delete**

```
┌─────────────────────────────────────────────────────────────────┐
│                     1. USER UPLOADS IMAGE                       │
│  POST /api/images/upload { file, tags, description }            │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
        ┌─────────────────────────────┐
        │ Tính MD5 Hash từ file       │
        │ const hash = MD5(fileBuffer)│
        └────────────┬────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │ Check Duplicate               │
        │ Image.findOne({fileHash: hash})│
        └────────┬──────────────┬────────┘
                 │              │
        ┌────────▼──┐   ┌──────▼──────────┐
        │ EXISTS?   │   │ NO (NEW FILE)   │
        │ YES       │   │ CONTINUE        │
        └─────┬─────┘   └────────┬────────┘
              │                  │
        ┌─────▼────────────┐     │
        │ Return existing  │     │
        │ image (refCount  │     │
        │ không thay đổi)  │     │
        └──────────────────┘     │
                                 ▼
                    ┌─────────────────────────────┐
                    │ Upload to Cloudinary        │
                    │ - Tạo unique folder         │
                    │ - Lưu public_id, secure_url │
                    └──────────┬──────────────────┘
                               │
                               ▼
                    ┌─────────────────────────────┐
                    │ Create Image Record in DB   │
                    │ {                           │
                    │   fileHash: "abc123...",   │
                    │   cloudinaryPublicId: "x",  │
                    │   refCount: 0,              │
                    │   usedBy: [],               │
                    │   uploadedBy: userId        │
                    │ }                           │
                    └──────────┬──────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │ Return imageId   │
                        └──────────────────┘
                               │
┌──────────────────────────────┴──────────────────────────────────┐
│                   2. CREATE BLOG WITH IMAGE                     │
│  POST /api/blog { title, imageId, ... }                         │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   ▼
        ┌────────────────────────────┐
        │ Create Blog Document       │
        │ Blog = { title, image, ... }
        └────────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │ Add Image Reference            │
        │ imageService.addReference(     │
        │   imageId,                     │
        │   {                            │
        │     entityType: 'blog',        │
        │     entityId: blog._id,        │
        │     field: 'image'             │
        │   }                            │
        │ )                              │
        └────────────┬───────────────────┘
                     │
                     ▼
        ┌──────────────────────────────────┐
        │ Update Image in DB:              │
        │ - refCount: 0 → 1                │
        │ - usedBy.push({                  │
        │     entityType: 'blog',          │
        │     entityId: blogId,            │
        │     field: 'image',              │
        │     addedAt: now()               │
        │   })                             │
        └──────────┬───────────────────────┘
                   │
                   ▼
            ┌──────────────────┐
            │ Return Blog      │
            │ refCount = 1 ✅   │
            └──────────────────┘
                   │
┌──────────────────┴─────────────────────────────────────────────┐
│            3. SCENARIO: UPDATE BLOG (CHANGE IMAGE)             │
│  PUT /api/blog/:id { title, imageId: newImageId }              │
└──────────────────┬────────────────────────────────────────────┘
                   │
                   ▼
        ┌────────────────────────────────┐
        │ Get Current Blog               │
        │ oldImageId = blog.image        │
        │ newImageId = request.imageId   │
        └────────────┬───────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │ oldImageId !== newImageId?  │
        └────────┬──────────────┬──────┘
                 │              │
            ┌────▼────┐  ┌──────▼──────────┐
            │ YES     │  │ NO              │
            │ CHANGE  │  │ SAME IMAGE      │
            └────┬────┘  │ Skip reference  │
                 │       │ updates         │
                 │       └─────────────────┘
                 │
                 ▼
    ┌────────────────────────────────┐
    │ REMOVE OLD REFERENCE           │
    │ imageService.removeReference(  │
    │   oldImageId,                  │
    │   { entityType, entityId, ... }│
    │ )                              │
    └────────────┬───────────────────┘
                 │
                 ▼
    ┌──────────────────────────────┐
    │ OLD Image Update:            │
    │ - refCount: 1 → 0            │
    │ - usedBy.remove(this blog)   │
    │                              │
    │ Check: refCount = 0?         │
    └────────┬───────────┬─────────┘
             │           │
        ┌────▼──┐  ┌─────▼──────────────────┐
        │ YES   │  │ NO (used by others)    │
        │ 0     │  │ Keep in DB              │
        └────┬──┘  └───────────────────────┘
             │
             ▼
    ┌────────────────────────────┐
    │ DELETE from Cloudinary     │
    │ + Delete from DB           │
    │ (Image completely removed) │
    └────────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────┐
    │ ADD NEW REFERENCE              │
    │ imageService.addReference(     │
    │   newImageId,                  │
    │   { entityType, entityId, ... }│
    │ )                              │
    └────────────┬───────────────────┘
                 │
                 ▼
    ┌──────────────────────────────┐
    │ NEW Image Update:            │
    │ - refCount: 0 → 1 (or more)  │
    │ - usedBy.push(this blog)     │
    └──────────────────────────────┘
                 │
                 ▼
            ┌──────────────────┐
            │ Update & Return  │
            │ Blog with        │
            │ new imageId ✅   │
            └──────────────────┘
```

---

## 2️⃣ **SCENARIOS CHÍNH**

### **Scenario A: Single Image - One Blog**

```
Timeline:
┌────────┬────────┬────────┬────────┐
│ Upload │ Create │ Update │ Delete │
│ Image  │ Blog   │ Blog   │ Blog   │
└────────┴────────┴────────┴────────┘

Image Lifecycle:
  refCount = 0 (orphaned) 
         ↓
  refCount = 1 (used by blog)
         ↓
  refCount = 0 (blog deleted)
         ↓
  Auto-deleted from Cloudinary after 30 days (cleanup job)
         ↓
  Completely gone
```

**Flow Code:**
```typescript
// 1. Upload image
const img1 = await imageService.uploadImage(file, userId);
// Image: { _id: img1Id, refCount: 0, usedBy: [] }

// 2. Create blog
const blog1 = await blogService.createBlog({
  title: 'Blog 1',
  image: img1Id
});
// Image updated: { refCount: 1, usedBy: [{ blog1 }] }

// 3. Delete blog
await blogService.deleteBlog(blog1Id);
// imageService.removeReference(img1Id) called
// Image: refCount = 0 → DELETE from Cloudinary
// ✅ Image completely removed
```

---

### **Scenario B: Shared Image - Multiple Entities**

```
Timeline:
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│ Upload   │ Create   │ Create   │ Delete   │ Delete   │
│ Image    │ Blog1    │ Blog2    │ Blog1    │ Blog2    │
└──────────┴──────────┴──────────┴──────────┴──────────┘

Image Lifecycle:
  refCount = 0 (orphaned)
         ↓
  refCount = 1 (Blog1 uses it)
         ↓
  refCount = 2 (Blog2 also uses it) ← CRITICAL: Same image!
         ↓
  refCount = 1 (Blog1 deleted)
         ↓
  refCount = 0 (Blog2 deleted)
         ↓
  Auto-deleted after 30 days
```

**Flow Code:**
```typescript
// 1. Upload image ONCE
const sharedImg = await imageService.uploadImage(file1, userId);
// Image: { _id: imgId, refCount: 0, usedBy: [] }

// 2. Create Blog1 with image
const blog1 = await blogService.createBlog({
  title: 'Blog 1',
  image: imgId
});
// Image: { refCount: 1, usedBy: [{ entityType: 'blog', entityId: blog1Id, field: 'image' }] }

// 3. Create Blog2 with SAME image
const blog2 = await blogService.createBlog({
  title: 'Blog 2',
  image: imgId  // ← SAME IMAGE ID
});
// Image: { refCount: 2, usedBy: [blog1, blog2] }

// 4. Delete Blog1
await blogService.deleteBlog(blog1Id);
// removeReference(imgId) → refCount: 2 → 1
// Image still in Cloudinary (still used by Blog2)
// ✅ Image NOT deleted yet

// 5. Delete Blog2
await blogService.deleteBlog(blog2Id);
// removeReference(imgId) → refCount: 1 → 0
// ✅ NOW delete from Cloudinary + DB
```

---

### **Scenario C: Duplicate Upload Prevention**

```
Timeline:
┌──────────────┬──────────────┬──────────┐
│ Upload       │ Upload SAME  │ Use Both │
│ Image.jpg    │ Image.jpg    │ Blogx2   │
└──────────────┴──────────────┴──────────┘

MD5 Hash Check:
  File1 MD5: abc123... 
         ↓
  File2 MD5: abc123... (DUPLICATE!)
         ↓
  Return existing image (same _id)
         ↓
  Frontend gets same imageId
         ↓
  Result: 1 Cloudinary file, 1 DB record, refCount = 2

Benefit: Save storage, bandwidth, money!
```

**Flow Code:**
```typescript
// 1. Upload image.jpg
const upload1 = await imageService.uploadImage(file1, userId);
// Hash: abc123, Image created, Cloudinary upload done
// Image: { _id: 'img-abc123', fileHash: 'abc123', refCount: 0 }

// 2. Upload SAME image.jpg again
const upload2 = await imageService.uploadImage(file1, userId);
// Hash: abc123 (SAME!)
// Check: Image.findOne({fileHash: 'abc123'}) → FOUND
// Return existing: { _id: 'img-abc123' }
// ✅ NO second Cloudinary upload!

// 3. Both upload1 and upload2 have same _id
console.log(upload1._id === upload2._id); // true ✅

// 4. Create 2 blogs with both IDs
await blogService.createBlog({ image: upload1._id });
await blogService.createBlog({ image: upload2._id });
// Image: { refCount: 2, usedBy: [blog1, blog2] }
// ✅ 1 Cloudinary image, 2 references!
```

---

### **Scenario D: Image Update - Multiple Images**

```
Timeline:
┌────────┬────────┬────────┬────────┬────────┐
│ Create │ Upload │ Update │ Update │ Delete │
│ Blog   │ Img1   │ Img1→2 │ Img2→1 │ Blog   │
└────────┴────────┴────────┴────────┴────────┘

State Changes:
Step 1: Blog created, no image
  Blog: { image: null }
  Img1: { refCount: 0 }

Step 2: Upload Img1
  Blog: { image: null }
  Img1: { refCount: 0 }

Step 3: Update blog with Img1
  Blog: { image: Img1 }
  Img1: { refCount: 1, usedBy: [blog] } ← INCREASED

Step 4: Change to Img2
  Blog: { image: Img2 }
  Img1: { refCount: 0 } ← DECREASED, removed from usedBy
  Img2: { refCount: 1, usedBy: [blog] } ← INCREASED

Step 5: Change back to Img1
  Blog: { image: Img1 }
  Img1: { refCount: 1, usedBy: [blog] } ← INCREASED again
  Img2: { refCount: 0 } ← DECREASED

Step 6: Delete blog
  Img1: deleted from Cloudinary (refCount = 0)
  Img2: still in DB (refCount = 0, cleanup after 30 days)
```

---

## 3️⃣ **EDGE CASES & ERROR HANDLING**

### **Case 1: Upload FAIL in Middle**

```
User uploads large image → Network fails halfway

┌─────────────────┐
│ Start Upload    │
│ MD5 calculate   │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│ Check duplicate     │
│ (Passes)            │
└────────┬────────────┘
         │
         ▼
┌────────────────────┐
│ Upload to          │
│ Cloudinary...      │
│ ✗ NETWORK ERROR!   │
└────────┬───────────┘
         │
         ▼
    ┌─────────────┐
    │ Catch error │
    │ Throw error │
    └────┬────────┘
         │
         ▼
    ┌──────────────────────┐
    │ Response: 500        │
    │ No image created in  │
    │ DB ✅ SAFE           │
    │ (No orphaned records)│
    └──────────────────────┘

Solution: Retry upload
```

---

### **Case 2: Reference Add FAIL**

```
Blog created successfully, but addReference fails

Timeline:
┌──────────────┬─────────────────┐
│ Create Blog  │ Add Reference   │
│ SUCCESS ✓    │ FAIL ✗          │
└──────────────┴────────┬────────┘
                        │
                        ▼
            ┌────────────────────────┐
            │ Blog exists in DB      │
            │ BUT refCount not ↑     │
            │                        │
            │ INCONSISTENCY! ❌      │
            └────────┬───────────────┘
                     │
                     ▼
        ┌─────────────────────────┐
        │ Image: refCount = 0     │
        │ But used by blog!       │
        │                         │
        │ At cleanup:             │
        │ Deleted from Cloudinary │
        │ Blog loses image! ❌    │
        └─────────────────────────┘

Prevention:
- Use try-catch in addReference
- Log error for manual intervention
- Alert admin if inconsistency detected
```

---

### **Case 3: Delete Image While In Use**

```
Admin tries to delete image with refCount > 0

Delete Request:
  DELETE /api/images/img123
  Where: img123 refCount = 2 (used by blog1, blog2)

Backend Check:
  if (image.refCount > 0) {
    throw new BadRequestError(
      `Cannot delete. Used by ${image.refCount} entities`
    );
  }

Response:
  400 Bad Request
  "Cannot delete. Used by 2 entities:
   - blog (id: blog1) in field: image
   - blog (id: blog2) in field: image"

✅ SAFE - Image NOT deleted
```

---

### **Case 4: Orphaned Images - Normal**

```
User uploads image but never uses it

Timeline:
┌──────────┬──────────┬──────────┐
│ Upload   │ 7 days   │ 30 days  │
│ Image    │ pass     │ CLEANUP  │
└──────────┴──────────┴──────────┘

State:
Day 0: { refCount: 0, createdAt: Day0, usedBy: [] }
Day 7: { refCount: 0, ... }  (still orphaned)
Day 30: Cleanup job runs
  - Check: refCount = 0 AND createdAt < 30 days ago? YES
  - Action: DELETE from Cloudinary + DB
  - Result: ✅ Removed

Effect: Storage cleaned automatically
```

---

### **Case 5: Rapid Update Same Blog**

```
User updates blog image 5 times in 2 seconds

Requests:
  PUT /api/blog/123 { image: img1 }
  PUT /api/blog/123 { image: img2 }
  PUT /api/blog/123 { image: img3 }
  PUT /api/blog/123 { image: img4 }
  PUT /api/blog/123 { image: img5 }

Timeline:
Request 1: blog.image = img1
  removeReference(old) → add img1
  Img1: refCount 0 → 1 ✓

Request 2: blog.image = img2
  removeReference(img1) → Img1: 1 → 0 (DELETE from Cloudinary!)
  addReference(img2) → Img2: 0 → 1 ✓

Request 3-5: Similar pattern
  Img1 deleted immediately! ❌

Result:
  Final blog.image = img5
  Img1, img2, img3, img4 all deleted
  ✅ Correct behavior (only last image needed)

BUT: If network timeout on Request 5
  Blog stays with Img4
  Img5 orphaned for 30 days then cleanup
```

---

### **Case 6: Concurrent Delete Operations**

```
Two admins try to delete blog simultaneously

Request 1:           Request 2:
GET blog ✓          GET blog ✓
(img._id = img1)    (img._id = img1)
  │                   │
  ├─ Check: img1     │
  │  refCount=1 ✓    │
  │                   ├─ Check: img1
  │                   │  refCount=1 ✓
  ├─ Remove ref      │
  │  img1: 1→0       │
  │  DELETE from     │
  │  Cloudinary ✓    │
  │                   │
  │                   ├─ Remove ref
  │                   │  img1 already
  │                   │  deleted! ❌
  │                   │  Error!
  └───────────────────┘

Prevention:
- Use database transaction (if MongoDB supports)
- Use lock/mutex
- Idempotent: removing non-existent ref = no error
- Current code: catches and logs, continues
```

---

## 4️⃣ **STATE DIAGRAM**

```
                    ┌──────────────────────┐
                    │  IMAGE STATES        │
                    └──────────────────────┘

                    START (Upload)
                         │
                         ▼
            ┌────────────────────────────┐
            │  ORPHANED                  │
            │  refCount = 0              │
            │  usedBy = []               │
            │  Cloudinary: EXISTS        │
            │  DB: EXISTS                │
            └────────┬─────────┬─────────┘
                     │         │
         ┌───────────┘         └──────────┐
         │                                │
         ▼                                ▼
    ┌────────────────┐        ┌──────────────────────┐
    │ IN USE         │        │ AUTO-DELETE (30 days)│
    │ refCount ≥ 1   │        │ Cleanup job triggers │
    │ usedBy > 0     │        │ if createdAt < 30d   │
    │ Cloudinary: ✓  │        │ → DELETE              │
    │ DB: ✓          │        └──────────────────────┘
    └────┬──────┬────┘                 │
         │      │                      ▼
         │      │         ┌────────────────────┐
         │      │         │ DELETED            │
         │      │         │ refCount = N/A     │
         │      │         │ usedBy = N/A       │
         │      │         │ Cloudinary: ✗      │
         │      │         │ DB: ✗              │
         │      │         │ GONE FOREVER       │
         │      │         └────────────────────┘
         │      │
    ┌────▼──────▼──────┐
    │ Update entity    │
    │ remove reference │
    └────┬─────────────┘
         │
         ▼ (if refCount > 0)
    ┌──────────────────┐
    │ Still IN USE     │
    │ other entities   │
    │ keep it ✓        │
    └─────────────────┘
         │
         └──────────────────┐
                            ▼
                    ┌─────────────┐
                    │ ORPHANED    │
                    │ again       │
                    │ (if all     │
                    │  removed)   │
                    └─────────────┘
```

---

## 5️⃣ **REFERENCE TRACKING DETAILS**

### **usedBy Structure:**

```typescript
usedBy: [
  {
    entityType: 'blog',          // What type uses this image
    entityId: '507f1f77bcf86cd799439011',  // Which entity ID
    field: 'image',              // Which field (image, gallery, avatar, etc)
    addedAt: 2024-01-03T10:00:00Z  // When added
  },
  {
    entityType: 'information',
    entityId: '507f1f77bcf86cd799439012',
    field: 'image',
    addedAt: 2024-01-03T10:30:00Z
  },
  {
    entityType: 'user',
    entityId: '507f1f77bcf86cd799439013',
    field: 'avatar',
    addedAt: 2024-01-03T11:00:00Z
  }
]

refCount = 3 (usedBy.length)
```

### **Remove Reference Algorithm:**

```typescript
async removeReference(imageId, { entityType, entityId, field }) {
  const image = await Image.findById(imageId);
  
  // 1. Find matching entry in usedBy
  const entryIndex = image.usedBy.findIndex(u =>
    u.entityType === entityType &&
    u.entityId === entityId &&
    u.field === field
  );
  
  if (entryIndex === -1) {
    throw new Error('Reference not found');
  }
  
  // 2. Remove from usedBy array
  image.usedBy.splice(entryIndex, 1);
  
  // 3. Update refCount
  image.refCount = image.usedBy.length;
  
  // 4. If refCount = 0, delete from Cloudinary
  if (image.refCount === 0) {
    await cloudinary.uploader.destroy(image.cloudinaryPublicId);
    await image.deleteOne();  // Delete from DB
    return { deleted: true };
  }
  
  // 5. Otherwise, just save reduced refCount
  await image.save();
  return { deleted: false, refCount: image.refCount };
}
```

---

## 6️⃣ **TRANSFORMATION WORKFLOW**

```
User requests image transformation

Request:
POST /api/images/img123/transform
{
  "name": "thumbnail",
  "width": 200,
  "height": 200,
  "crop": "fill",
  "quality": 80,
  "format": "webp"
}

Process:
┌─────────────┐
│ Check if    │
│ transformation
│ already     │
│ cached?     │
└────┬────┬──┘
     │    │
  YES    NO
     │    │
     ▼    ▼
  ┌────┐ ┌──────────────────────┐
  │Return│  Build Cloudinary URL │
  │cached│  w_200,h_200,c_fill,  │
  │URL   │  q_80,f_webp/img123   │
  └────┘ └──────────┬────────────┘
              │
              ▼
    ┌──────────────────┐
    │ Cache transformation
    │ in DB            │
    │ transformations: │
    │ [{               │
    │   name: 'thumb' │
    │   url: 'https...'
    │   width: 200    │
    │   height: 200   │
    │   params: {...} │
    │ }]              │
    └────────┬────────┘
             │
             ▼
    ┌────────────────────┐
    │ Return URL         │
    │ Frontend displays  │
    │ transformed image  │
    │ without re-upload  │
    └────────────────────┘

Benefits:
✅ No re-upload needed
✅ Cached for future use
✅ Multiple sizes from 1 upload
✅ Cloudinary handles optimization
✅ Cost effective
```

---

## 7️⃣ **ERROR SCENARIOS & RESPONSES**

| Scenario | Error | Code | How to Handle |
|----------|-------|------|--------------|
| No file uploaded | "No file uploaded" | 400 | Check form data has file |
| File too large | "File exceeds limit" | 413 | Limit: 25MB (config) |
| Invalid mime type | "File type not allowed" | 400 | Upload: jpg, png, gif, webp only |
| Network timeout on Cloudinary | "Upload failed" | 503 | Retry mechanism |
| Image not found | "Image not found" | 404 | Check image ID exists |
| Delete in-use image | "Cannot delete. Used by X entities" | 400 | First remove all references |
| Duplicate reference | "Reference already exists" | 409 | Skip if already added |
| Missing reference | "Reference not found" | 404 | Check entity type, ID, field |

---

## 8️⃣ **BEST PRACTICES**

### ✅ DO:
1. **Upload first, use later** - Upload image, get ID, then use it
2. **Always provide entityType/entityId** - Helps tracking
3. **Clean up drafts** - Remove unused images after 30 days
4. **Use transformations** - Don't upload multiple sizes
5. **Check refCount** - Know how many entities use it
6. **Tag images** - Organize by purpose
7. **Monitor Cloudinary** - Watch storage usage
8. **Test deletion flow** - Ensure auto-delete works

### ❌ DON'T:
1. ❌ Delete image while still in use
2. ❌ Upload same file multiple times (dedup handles it)
3. ❌ Rely on manual cleanup (use cleanup job)
4. ❌ Store image URLs in code (always fetch from API)
5. ❌ Upload huge images (compress first)
6. ❌ Forget to remove reference on update (service handles it)
7. ❌ Share Cloudinary credentials in frontend
8. ❌ Assume immediate delete (30-day cleanup window)

---

## 9️⃣ **SUMMARY TABLE**

| Action | refCount Change | Cloudinary | DB | Time |
|--------|-----------------|-----------|--|----|
| Upload image | 0 (orphaned) | ✅ Uploaded | ✅ Created | Immediate |
| Use image (create entity) | 0→1 | ✅ Unchanged | ✅ ref added | Immediate |
| Change image (update entity) | 1→0 (old), 0→1 (new) | ✅ Delete old if 0 | ✅ Update | Immediate |
| Remove image (delete entity) | 1→0 | ⚠️ Maybe delete | ⚠️ Maybe delete | Immediate |
| Cleanup unused (30d+, refC=0) | N/A | ❌ Deleted | ❌ Deleted | Daily job |

---

## 🔟 **DEBUGGING CHECKLIST**

When image issues occur, check:

```
☐ 1. Image exists in DB
    db.images.findById('img-id')
    
☐ 2. Cloudinary public_id correct
    Check image.cloudinaryPublicId
    
☐ 3. refCount matches usedBy length
    image.refCount === image.usedBy.length
    
☐ 4. usedBy has correct entries
    image.usedBy.map(u => `${u.entityType}:${u.entityId}`)
    
☐ 5. Entity still exists
    db.blogs.findById('blog-id') - Does it exist?
    
☐ 6. Check Cloudinary console
    https://cloudinary.com/console/media_library
    Public ID should match image.cloudinaryPublicId
    
☐ 7. Check logs for errors
    grep "image" logs/ -i
    
☐ 8. Try cleanup job manually
    POST /api/images/cleanup?daysOld=0
    (This will delete ALL orphaned images immediately)
```

---

**Tóm lại:** Hệ thống Image hoạt động như một **Reference Counter** thông minh - auto cleanup khi không ai dùng, safe delete, dedup uploads, optimize storage. Bất cứ lúc nào không chắc, check `refCount` và `usedBy` array! 🎯

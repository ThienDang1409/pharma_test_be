const express = require('express');
const router = express.Router();
const Information = require('../model/informationModel');
const { generateSlug, generateUniqueSlug } = require('../utils/slugHelper');

// =============================
// 🔹 1. Lấy tất cả Information (có thể dạng cây hoặc phẳng)
// =============================
router.get('/', async (req, res) => {
  try {
    const informations = await Information.find().lean();

    // Nếu có query dạng ?tree=true thì trả về dạng cây
    if (req.query.tree === 'true') {
      const buildTree = (items, parentId = null) => {
        return items
          .filter(item => String(item.parentId || '') === String(parentId || ''))
          .map(item => ({
            ...item,
            children: buildTree(items, item._id)
          }));
      };

      const tree = buildTree(informations);
      return res.status(200).json(tree);
    }

    // Trả về danh sách phẳng
    res.status(200).json(informations);
  } catch (error) {
    console.error('Error fetching information:', error);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách information.' });
  }
});

// =============================
// 🔹 2. Lấy 1 Information theo ID
// =============================
router.get('/:id', async (req, res) => {
  try {
    const info = await Information.findById(req.params.id);
    if (!info) {
      return res.status(404).json({ message: 'Không tìm thấy mục.' });
    }
    res.status(200).json(info);
  } catch (error) {
    console.error('Error fetching information by id:', error);
    res.status(500).json({ message: 'Lỗi khi lấy thông tin.' });
  }
});

// =============================
// 🔹 3. Thêm mới một Information
// =============================
router.post('/', async (req, res) => {
  try {
    let { name, name_en, slug, parentId, description, description_en, image, order } = req.body;

    // Auto-generate slug from English name (preferred) or Vietnamese name
    if (!slug) {
      const baseSlug = generateSlug(name_en || name);
      slug = await generateUniqueSlug(baseSlug, Information);
    } else {
      // Check if provided slug exists
      const existing = await Information.findOne({ slug });
      if (existing) {
        return res.status(400).json({ message: 'Slug đã tồn tại.' });
      }
    }

    const info = new Information({
      name,
      name_en,
      slug,
      parentId: parentId || null,
      description,
      description_en,
      image,
      order
    });

    const savedInfo = await info.save();
    res.status(201).json(savedInfo);
  } catch (error) {
    console.error('Error creating information:', error);
    res.status(500).json({ message: 'Lỗi khi thêm mới information.' });
  }
});

// =============================
// 🔹 4. Cập nhật Information
// =============================
router.put('/:id', async (req, res) => {
  try {
    let { name, name_en, slug, parentId, description, description_en, image, order } = req.body;

    // Get existing info
    const existingInfo = await Information.findById(req.params.id);
    if (!existingInfo) {
      return res.status(404).json({ message: 'Không tìm thấy mục để cập nhật.' });
    }

    // If name_en or name changed and no slug provided, regenerate slug
    // Prioritize English name for slug generation
    const nameForSlug = name_en || name;
    const existingNameForSlug = existingInfo.name_en || existingInfo.name;
    
    if (nameForSlug !== existingNameForSlug && !slug) {
      const baseSlug = generateSlug(nameForSlug);
      slug = await generateUniqueSlug(baseSlug, Information, req.params.id);
    } else if (!slug) {
      slug = existingInfo.slug; // Keep existing slug
    }

    const updatedInfo = await Information.findByIdAndUpdate(
      req.params.id,
      { name, name_en, slug, parentId, description, description_en, image, order },
      { new: true }
    );

    res.status(200).json(updatedInfo);
  } catch (error) {
    console.error('Error updating information:', error);
    res.status(500).json({ message: 'Lỗi khi cập nhật information.' });
  }
});

// =============================
// 🔹 5. Xóa Information (và có thể xóa cả con nếu cần)
// =============================
router.delete('/:id', async (req, res) => {
  try {
    const info = await Information.findById(req.params.id);
    if (!info) {
      return res.status(404).json({ message: 'Không tìm thấy mục để xóa.' });
    }

    // Xóa tất cả con của nó (nếu có)
    await Information.deleteMany({ parentId: req.params.id });
    await Information.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Đã xóa thành công (bao gồm các mục con).' });
  } catch (error) {
    console.error('Error deleting information:', error);
    res.status(500).json({ message: 'Lỗi khi xóa information.' });
  }
});

// =============================
// 🔹 6. Lấy toàn bộ con của 1 parent cụ thể
// =============================
router.get('/parent/:parentId', async (req, res) => {
  try {
    const children = await Information.find({ parentId: req.params.parentId });
    res.status(200).json(children);
  } catch (error) {
    console.error('Error fetching children:', error);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách con.' });
  }
});

module.exports = router;

/**
 * Generate URL-friendly slug from Vietnamese text
 * Converts Vietnamese characters to ASCII equivalents
 * @param {string} text - Input text (Vietnamese or English)
 * @returns {string} - URL-friendly slug
 */
function generateSlug(text) {
  if (!text) return '';

  // Convert to lowercase
  let slug = text.toLowerCase();

  // Vietnamese character map
  const vietnameseMap = {
    'à': 'a', 'á': 'a', 'ạ': 'a', 'ả': 'a', 'ã': 'a',
    'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ậ': 'a', 'ẩ': 'a', 'ẫ': 'a',
    'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ặ': 'a', 'ẳ': 'a', 'ẵ': 'a',
    'è': 'e', 'é': 'e', 'ẹ': 'e', 'ẻ': 'e', 'ẽ': 'e',
    'ê': 'e', 'ề': 'e', 'ế': 'e', 'ệ': 'e', 'ể': 'e', 'ễ': 'e',
    'ì': 'i', 'í': 'i', 'ị': 'i', 'ỉ': 'i', 'ĩ': 'i',
    'ò': 'o', 'ó': 'o', 'ọ': 'o', 'ỏ': 'o', 'õ': 'o',
    'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ộ': 'o', 'ổ': 'o', 'ỗ': 'o',
    'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ợ': 'o', 'ở': 'o', 'ỡ': 'o',
    'ù': 'u', 'ú': 'u', 'ụ': 'u', 'ủ': 'u', 'ũ': 'u',
    'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ự': 'u', 'ử': 'u', 'ữ': 'u',
    'ỳ': 'y', 'ý': 'y', 'ỵ': 'y', 'ỷ': 'y', 'ỹ': 'y',
    'đ': 'd',
    ' ': '-', '_': '-', '/': '-', '\\': '-',
    '(': '', ')': '', '[': '', ']': '', '{': '', '}': '',
    '!': '', '?': '', '.': '', ',': '', ':': '', ';': '',
    '"': '', "'": '', '`': '', '~': '', '@': '', '#': '',
    '$': '', '%': '', '^': '', '&': '', '*': '', '+': '',
    '=': '', '|': '', '<': '', '>': ''
  };

  // Replace Vietnamese characters
  slug = slug.split('').map(char => vietnameseMap[char] || char).join('');

  // Remove any remaining non-alphanumeric characters (except hyphens)
  slug = slug.replace(/[^a-z0-9-]/g, '');

  // Remove consecutive hyphens
  slug = slug.replace(/-+/g, '-');

  // Remove leading/trailing hyphens
  slug = slug.replace(/^-+|-+$/g, '');

  return slug;
}

/**
 * Generate unique slug by appending number if slug exists
 * @param {string} baseSlug - Base slug to check
 * @param {Object} Model - Mongoose model to check against
 * @param {string} excludeId - ID to exclude from uniqueness check (for updates)
 * @returns {Promise<string>} - Unique slug
 */
async function generateUniqueSlug(baseSlug, Model, excludeId = null) {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const query = { slug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const existing = await Model.findOne(query);
    
    if (!existing) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

module.exports = {
  generateSlug,
  generateUniqueSlug
};

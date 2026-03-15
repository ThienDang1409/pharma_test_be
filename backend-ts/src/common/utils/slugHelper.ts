import { Model, Document } from 'mongoose';

/**
 * Generate URL-friendly slug from Vietnamese text
 * Converts Vietnamese characters to ASCII equivalents
 */
export const generateSlug = (text: string): string => {
  if (!text) return '';

  // Convert to lowercase
  let slug = text.toLowerCase();

  // Vietnamese character map
  const vietnameseMap: Record<string, string> = {
    à: 'a', á: 'a', ạ: 'a', ả: 'a', ã: 'a',
    â: 'a', ầ: 'a', ấ: 'a', ậ: 'a', ẩ: 'a', ẫ: 'a',
    ă: 'a', ằ: 'a', ắ: 'a', ặ: 'a', ẳ: 'a', ẵ: 'a',
    è: 'e', é: 'e', ẹ: 'e', ẻ: 'e', ẽ: 'e',
    ê: 'e', ề: 'e', ế: 'e', ệ: 'e', ể: 'e', ễ: 'e',
    ì: 'i', í: 'i', ị: 'i', ỉ: 'i', ĩ: 'i',
    ò: 'o', ó: 'o', ọ: 'o', ỏ: 'o', õ: 'o',
    ô: 'o', ồ: 'o', ố: 'o', ộ: 'o', ổ: 'o', ỗ: 'o',
    ơ: 'o', ờ: 'o', ớ: 'o', ợ: 'o', ở: 'o', ỡ: 'o',
    ù: 'u', ú: 'u', ụ: 'u', ủ: 'u', ũ: 'u',
    ư: 'u', ừ: 'u', ứ: 'u', ự: 'u', ử: 'u', ữ: 'u',
    ỳ: 'y', ý: 'y', ỵ: 'y', ỷ: 'y', ỹ: 'y',
    đ: 'd',
    ' ': '-', _: '-', '/': '-', '\\': '-',
    '(': '', ')': '', '[': '', ']': '', '{': '', '}': '',
    '!': '', '?': '', '.': '', ',': '', ':': '', ';': '',
    '"': '', "'": '', '`': '', '~': '', '@': '', '#': '',
    $: '', '%': '', '^': '', '&': '', '*': '', '+': '',
    '=': '', '|': '', '<': '', '>': '',
  };

  // Replace Vietnamese characters
  slug = slug
    .split('')
    .map((char) => vietnameseMap[char] || char)
    .join('');

  // Remove any remaining non-alphanumeric characters (except hyphens)
  slug = slug.replace(/[^a-z0-9-]/g, '');

  // Remove consecutive hyphens
  slug = slug.replace(/-+/g, '-');

  // Remove leading/trailing hyphens
  slug = slug.replace(/^-+|-+$/g, '');

  return slug;
};

/**
 * Generate unique slug by appending number if slug already exists
 * @param baseSlug - The initial slug to check
 * @param model - Mongoose model to check against
 * @param excludeId - Optional ID to exclude from uniqueness check (for updates)
 */
export const generateUniqueSlug = async (
  baseSlug: string,
  model: Model<any>,
  excludeId?: string
): Promise<string> => {
  let slug = baseSlug;
  let counter = 1;
    
  while (true) {
    const query: any = { slug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const existingDoc = await model.findOne(query);

    if (!existingDoc) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};

/**
 * Helper types and interfaces for image management
 * Use these with ImageService in your entity services
 */

export interface ImageReference {
  entityType: 'blog' | 'user' | 'information' | 'other';
  entityId: string;
  field: string;
}

/**
 * Extract unique image IDs from array
 */
export function getUniqueImageIds(imageIds: (string | undefined | null)[]): string[] {
  return [...new Set(imageIds.filter((id): id is string => Boolean(id)))];
}

/**
 * Compare two arrays and return differences
 * Returns: { toAdd: string[], toRemove: string[] }
 */
export function getImageChanges(
  oldImageIds: string[],
  newImageIds: string[]
): { toAdd: string[]; toRemove: string[] } {
  const oldSet = new Set(getUniqueImageIds(oldImageIds));
  const newSet = new Set(getUniqueImageIds(newImageIds));

  const toAdd = [...newSet].filter((id) => !oldSet.has(id));
  const toRemove = [...oldSet].filter((id) => !newSet.has(id));

  return { toAdd, toRemove };
}

/**
 * Example usage in Blog Service:
 * 
 * import { ImageService } from '../image/image.service';
 * import { getImageChanges, getUniqueImageIds } from '../../common/utils';
 * 
 * const imageService = new ImageService();
 * 
 * // When creating entity:
 * const imageIds = getUniqueImageIds([data.mainImage, ...data.gallery]);
 * for (const imageId of imageIds) {
 *   await imageService.addReference(imageId, {
 *     entityType: 'blog',
 *     entityId: blog._id.toString(),
 *     field: 'images'
 *   });
 * }
 * 
 * // When updating entity:
 * const oldImages = getUniqueImageIds([blog.mainImage, ...blog.gallery]);
 * const newImages = getUniqueImageIds([data.mainImage, ...data.gallery]);
 * const { toAdd, toRemove } = getImageChanges(oldImages, newImages);
 * 
 * for (const imageId of toAdd) {
 *   await imageService.addReference(imageId, {...});
 * }
 * for (const imageId of toRemove) {
 *   await imageService.removeReference(imageId, {...});
 * }
 * 
 * // When deleting entity:
 * const imageIds = getUniqueImageIds([blog.mainImage, ...blog.gallery]);
 * for (const imageId of imageIds) {
 *   await imageService.removeReference(imageId, {...});
 * }
 */

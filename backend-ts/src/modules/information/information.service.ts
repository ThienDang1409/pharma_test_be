import Information from './information.model';
import {
  CreateInformationDto,
  UpdateInformationDto,
  InformationQueryDto,
  InformationResponseDto,
  InformationTreeDto,
} from './information.dto';
import { NotFoundError, BadRequestError } from '../../common/exceptions';
import { IPaginationResult } from '../../common/types';
import { generateSlug, generateUniqueSlug } from '../../common/utils/slugHelper';
import { ImageService } from '../image/image.service';

export class InformationService {
  /**
   * Get all information categories with pagination and filters
   */
  async getAllInformation(query: InformationQueryDto): Promise<IPaginationResult<InformationResponseDto>> {
    const {
      page = 1,
      limit = 10,
      search,
      parentId,
      isActive,
    } = query;

    const filter: any = {};

    // Search by name (both languages)
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { name_en: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by parentId (null for root categories)
    if (parentId !== undefined) {
      filter.parentId = parentId === 'null' ? null : parentId;
    }

    // Filter by active status
    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    const total = await Information.countDocuments(filter);
    const information = await Information.find(filter)
      .populate({
        path: 'image',
        select: 'cloudinaryUrl cloudinaryPublicId _id',
      })
      .sort({ order: 1, createdAt: 1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();

    return {
      items: information as unknown as InformationResponseDto[],
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    };
  }

  /**
   * Get hierarchical tree structure of all categories
   */
  async getTree(isActive?: boolean): Promise<InformationTreeDto[]> {
    const filter: any = {};
    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    const allCategories = await Information.find(filter)
      .populate({
        path: 'image',
        select: 'cloudinaryUrl cloudinaryPublicId _id',
      })
      .sort({ order: 1 })
      .lean();

    // Build tree structure
    const buildTree = (
      parentId: string | null = null
    ): InformationTreeDto[] => {
      return allCategories
        .filter((cat) => cat.parentId === parentId)
        .map((cat) => ({
          ...(cat as any),
          _id: cat._id.toString(),
          children: buildTree(cat._id.toString()),
        })) as any;
    };

    return buildTree();
  }

  /**
   * Get information by ID
   */
  async getInformationById(id: string): Promise<InformationResponseDto> {
    const information = await Information.findById(id)
      .populate({
        path: 'image',
        select: 'cloudinaryUrl cloudinaryPublicId _id',
      })
      .lean();

    if (!information) {
      throw new NotFoundError('Information not found');
    }

    return information as unknown as InformationResponseDto;
  }

  /**
   * Get information by slug
   */
  async getInformationBySlug(slug: string): Promise<InformationResponseDto> {
    const information = await Information.findOne({ slug })
      .populate({
        path: 'image',
        select: 'cloudinaryUrl cloudinaryPublicId _id',
      })
      .lean();

    if (!information) {
      throw new NotFoundError('Information not found');
    }

    return information as unknown as InformationResponseDto;
  }

  /**
   * Get children of a category
   */
  async getChildren(parentId: string): Promise<InformationResponseDto[]> {
    const children = await Information.find({ parentId, isActive: true })
      .populate({
        path: 'image',
        select: 'cloudinaryUrl cloudinaryPublicId _id',
      })
      .sort({ order: 1 })
      .lean();

    return children as unknown as InformationResponseDto[];
  }

  /**
   * Create new information
   */
  async createInformation(
    data: CreateInformationDto
  ): Promise<InformationResponseDto> {
    // Sanitize empty strings to null for ObjectId fields
    if (data.image === '') data.image = undefined;
    if (data.parentId === '') data.parentId = null;

    // Validate parent exists if parentId provided
    if (data.parentId && data.parentId !== null) {
      const parent = await Information.findById(data.parentId);
      if (!parent) {
        throw new BadRequestError('Parent information not found');
      }
    }

    // Generate unique slug from name
    const slug = await generateUniqueSlug(generateSlug(data.name_en), Information);

    const information = await Information.create({
      ...data,
      slug,
      order: data.order ?? 0,
    });

    // Add image reference if image provided
    if (data.image) {
      const imageService = new ImageService();
      try {
        await imageService.addReference(data.image, {
          entityType: 'information',
          entityId: information._id.toString(),
          field: 'image',
        });
      } catch (error) {
        console.error('Failed to add image reference:', error);
      }
    }

    return information.toObject() as unknown as InformationResponseDto;
  }

  /**
   * Update information
   */
  async updateInformation(
    id: string,
    data: UpdateInformationDto
  ): Promise<InformationResponseDto> {
    const information = await Information.findById(id);

    if (!information) {
      throw new NotFoundError('Information not found');
    }

    // Sanitize empty strings to null for ObjectId fields
    if (data.image === '') data.image = undefined;
    if (data.parentId === '') data.parentId = null;

    // Handle image reference changes
    if (data.image !== undefined) {
      const imageService = new ImageService();
      const oldImage = information.image;
      const newImage = data.image;

      // If image changed, update references
      if (oldImage !== newImage) {
        // Remove old reference
        if (oldImage) {
          try {
            await imageService.removeReference(oldImage, {
              entityType: 'information',
              entityId: id,
              field: 'image',
            });
          } catch (error) {
            console.error('Failed to remove old image reference:', error);
          }
        }

        // Add new reference
        if (newImage) {
          try {
            await imageService.addReference(newImage, {
              entityType: 'information',
              entityId: id,
              field: 'image',
            });
          } catch (error) {
            console.error('Failed to add new image reference:', error);
          }
        }
      }
    }

    // Validate parent exists if parentId provided
    if (data.parentId && data.parentId !== null) {
      // Cannot set parent to itself
      if (data.parentId === id) {
        throw new BadRequestError('Cannot set category as its own parent');
      }

      const parent = await Information.findById(data.parentId);
      if (!parent) {
        throw new BadRequestError('Parent information not found');
      }

      // Check for circular references
      const isCircular = await this.checkCircularReference(
        id,
        data.parentId
      );
      if (isCircular) {
        throw new BadRequestError(
          'Circular reference detected - cannot set this parent'
        );
      }
    }

    // Regenerate slug if name changed
    if (data.name_en && data.name_en !== information.name_en) {
      const slug = await generateUniqueSlug(generateSlug(data.name_en), Information, id);
      Object.assign(information, { ...data, slug });
    } else {
      Object.assign(information, data);
    }

    await information.save();

    return information.toObject() as unknown as InformationResponseDto;
  }

  /**
   * Delete information
   */
  async deleteInformation(id: string): Promise<void> {
    const information = await Information.findById(id);

    if (!information) {
      throw new NotFoundError('Information not found');
    }

    // Check if has children
    const children = await Information.countDocuments({ parentId: id });
    if (children > 0) {
      throw new BadRequestError(
        'Cannot delete category with children. Delete children first.'
      );
    }

    // Remove image reference before deleting
    if (information.image) {
      const imageService = new ImageService();
      try {
        await imageService.removeReference(information.image, {
          entityType: 'information',
          entityId: id,
          field: 'image',
        });
        // Image will be auto-deleted from Cloudinary if refCount reaches 0
      } catch (error) {
        console.error('Failed to remove image reference:', error);
      }
    }

    await Information.findByIdAndDelete(id);
  }

  /**
   * Check for circular reference in hierarchy
   */
  private async checkCircularReference(
    categoryId: string,
    newParentId: string
  ): Promise<boolean> {
    let currentId: string | null = newParentId;

    while (currentId) {
      if (currentId === categoryId) {
        return true; // Circular reference found
      }

      const parent: any = await Information.findById(currentId).select('parentId').lean();
      currentId = parent?.parentId || null;
    }

    return false;
  }

  /**
   * Reorder information
   */
  async reorderInformation(
    items: Array<{ id: string; order: number }>
  ): Promise<void> {
    const updates = items.map(({ id, order }) =>
      Information.findByIdAndUpdate(id, { order })
    );

    await Promise.all(updates);
  }
}

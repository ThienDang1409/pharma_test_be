import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import crypto from 'crypto';
import mongoose from 'mongoose';
import Image from './image.model';
import {
  UploadImageDto,
  UpdateImageDto,
  ImageQueryDto,
  ImageResponseDto,
  AddReferenceDto,
  RemoveReferenceDto,
  TransformImageDto,
} from './image.dto';
import { NotFoundError, BadRequestError } from '../../common/exceptions';
import { IPaginationResult } from '../../common/types';
import config from '../../config';

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinaryName,
  api_key: config.cloudinaryApiKey,
  api_secret: config.cloudinaryApiSecret,
});

export class ImageService {
  /**
   * Calculate MD5 hash from buffer to detect duplicates
   */
  private calculateFileHash(buffer: Buffer): string {
    return crypto.createHash('md5').update(buffer).digest('hex');
  }

  /**
   * Check if image with same hash already exists
   * This prevents duplicate uploads
   */
  async findByHash(hash: string, session?: mongoose.ClientSession): Promise<ImageResponseDto | null> {
    const image = await Image.findOne({ fileHash: hash }).session(session || null).lean();
    return image ? (image as unknown as ImageResponseDto) : null;
  }

  /**
   * Upload image to Cloudinary
   * Returns existing image if hash matches (deduplication)
   */
  async uploadImage(
    file: Express.Multer.File,
    userId: string,
    dto: UploadImageDto = {},
    session?: mongoose.ClientSession
  ): Promise<ImageResponseDto> {
    // Calculate file hash for deduplication
    const fileHash = this.calculateFileHash(file.buffer);

    // Check if image already exists
    const existingImage = await this.findByHash(fileHash, session);
    if (existingImage) {
      // If entity info provided, add reference
      if (dto.entityType && dto.entityId && dto.field) {
        await this.addReference(existingImage._id, {
          entityType: dto.entityType,
          entityId: dto.entityId,
          field: dto.field,
        }, session);
        // Reload image with updated references
        return this.getImageById(existingImage._id, session);
      }
      return existingImage;
    }

    // Upload to Cloudinary
    const folder = dto.folder || 'uploads';
    const uploadResult: UploadApiResponse = await new Promise(
      (resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: 'auto',
            use_filename: true,
            unique_filename: true,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result!);
          }
        );
        uploadStream.end(file.buffer);
      }
    );

    const createdImages = await Image.create([{
      originalUrl: uploadResult.secure_url,
      cloudinaryPublicId: uploadResult.public_id,
      cloudinaryUrl: uploadResult.secure_url,
      fileHash,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      width: uploadResult.width,
      height: uploadResult.height,
      format: uploadResult.format,
      folder,
      uploadedBy: userId,
      tags: dto.tags || [],
      description: dto.description,
      refCount: dto.entityType && dto.entityId && dto.field ? 1 : 0,
      usedBy:
        dto.entityType && dto.entityId && dto.field
          ? [
              {
                entityType: dto.entityType,
                entityId: dto.entityId,
                field: dto.field,
                addedAt: new Date(),
              },
            ]
          : [],
    }], { session });

    return createdImages[0].toObject() as unknown as ImageResponseDto;
  }

  /**
   * Bulk upload multiple images
   */
  async uploadMultiple(
    files: Express.Multer.File[],
    userId: string,
    dto: UploadImageDto = {},
    session?: mongoose.ClientSession
  ): Promise<ImageResponseDto[]> {
    const results: ImageResponseDto[] = [];

    for (const file of files) {
      try {
        const image = await this.uploadImage(file, userId, dto);
        results.push(image);
      } catch (error: any) {
        // Log error but continue with other files
        console.error(`Failed to upload ${file.originalname}:`, error.message);
      }
    }

    return results;
  }

  /**
   * Get all images with filters and pagination
   */
  async getAllImages(query: ImageQueryDto): Promise<IPaginationResult<ImageResponseDto>> {
    const {
      page = 1,
      limit = 20,
      search,
      tags,
      folder,
      entityType,
      entityId,
      uploadedBy,
      unusedOnly,
    } = query;

    const filter: any = {};

    // Text search
    if (search) {
      filter.$text = { $search: search };
    }

    // Filter by tags
    if (tags) {
      const tagArray = tags.split(',').map((t) => t.trim());
      filter.tags = { $in: tagArray };
    }

    // Filter by folder
    if (folder) {
      filter.folder = folder;
    }

    // Filter by entity
    if (entityType && entityId) {
      filter['usedBy.entityType'] = entityType;
      filter['usedBy.entityId'] = entityId;
    } else if (entityType) {
      filter['usedBy.entityType'] = entityType;
    }

    // Filter by uploader
    if (uploadedBy) {
      filter.uploadedBy = uploadedBy;
    }

    // Filter unused images (refCount = 0)
    if (unusedOnly) {
      filter.refCount = 0;
    }

    const skip = (page - 1) * limit;

    const [images, total] = await Promise.all([
      Image.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Image.countDocuments(filter),
    ]);

    return {
      items: images as unknown as ImageResponseDto[],
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    };
  }

  /**
   * Get image by ID
   */
  async getImageById(id: string, session?: mongoose.ClientSession): Promise<ImageResponseDto> {
    const image = await Image.findById(id).session(session || null).lean();

    if (!image) {
      throw new NotFoundError('Image not found');
    }

    return image as unknown as ImageResponseDto;
  }

  /**
   * Update image metadata
   */
  async updateImage(
    id: string,
    dto: UpdateImageDto,
    session?: mongoose.ClientSession
  ): Promise<ImageResponseDto> {
    const image = await Image.findById(id).session(session || null);

    if (!image) {
      throw new NotFoundError('Image not found');
    }

    if (dto.tags !== undefined) image.tags = dto.tags;
    if (dto.description !== undefined) image.description = dto.description;

    await image.save();

    return image.toObject() as unknown as ImageResponseDto;
  }

  /**
   * Add reference to image (increment refCount)
   */
  async addReference(
    imageId: string,
    dto: AddReferenceDto,
    session?: mongoose.ClientSession
  ): Promise<ImageResponseDto> {
    const image = await Image.findById(imageId).session(session || null);

    if (!image) {
      throw new NotFoundError('Image not found');
    }

    // Check if reference already exists
    const existingRef = image.usedBy.find(
      (ref) =>
        ref.entityType === dto.entityType &&
        ref.entityId === dto.entityId &&
        ref.field === dto.field
    );

    if (existingRef) {
      // Reference already exists, just return
      return image.toObject() as unknown as ImageResponseDto;
    }

    // Add new reference
    image.usedBy.push({
      entityType: dto.entityType,
      entityId: dto.entityId,
      field: dto.field,
      addedAt: new Date(),
    });

    image.refCount = image.usedBy.length;

    await image.save({ session });

    return image.toObject() as unknown as ImageResponseDto;
  }

  /**
   * Remove reference from image (decrement refCount)
   * Auto-delete from Cloudinary if refCount reaches 0
   */
  async removeReference(
    imageId: string,
    dto: RemoveReferenceDto,
    session?: mongoose.ClientSession
  ): Promise<{ deleted: boolean; image?: ImageResponseDto }> {
    const image = await Image.findById(imageId).session(session || null);

    if (!image) {
      throw new NotFoundError('Image not found');
    }

    // Remove specific field or all references for entity
    if (dto.field) {
      image.usedBy = image.usedBy.filter(
        (ref) =>
          !(
            ref.entityType === dto.entityType &&
            ref.entityId === dto.entityId &&
            ref.field === dto.field
          )
      );
    } else {
      image.usedBy = image.usedBy.filter(
        (ref) =>
          !(ref.entityType === dto.entityType && ref.entityId === dto.entityId)
      );
    }

    image.refCount = image.usedBy.length;

    // If no more references, delete from Cloudinary and DB
    if (image.refCount === 0) {
      try {
        await cloudinary.uploader.destroy(image.cloudinaryPublicId);
      } catch (error) {
        console.error(
          `Failed to delete from Cloudinary: ${image.cloudinaryPublicId}`,
          error
        );
      }

      await image.deleteOne({ session });

      return { deleted: true };
    }

    await image.save({ session });

    return {
      deleted: false,
      image: image.toObject() as unknown as ImageResponseDto,
    };
  }

  /**
   * Get or create image transformation
   * This generates transformed URLs without re-uploading
   */
  async transformImage(
    imageId: string,
    dto: TransformImageDto,
    session?: mongoose.ClientSession
  ): Promise<{ url: string }> {
    const image = await Image.findById(imageId).session(session || null);

    if (!image) {
      throw new NotFoundError('Image not found');
    }

    // Check if transformation already exists
    const existing = image.transformations.find((t) => t.name === dto.name);
    if (existing) {
      return { url: existing.url };
    }

    // Build transformation string
    const transformations: string[] = [];

    if (dto.width || dto.height) {
      const crop = dto.crop || 'fill';
      const w = dto.width ? `w_${dto.width}` : '';
      const h = dto.height ? `h_${dto.height}` : '';
      const c = `c_${crop}`;
      transformations.push([w, h, c].filter(Boolean).join(','));
    }

    if (dto.quality) {
      transformations.push(`q_${dto.quality}`);
    }

    if (dto.format) {
      transformations.push(`f_${dto.format}`);
    }

    if (dto.gravity) {
      transformations.push(`g_${dto.gravity}`);
    }

    const transformString = transformations.join('/');

    // Generate transformed URL
    const parts = image.cloudinaryUrl.split('/upload/');
    const transformedUrl = `${parts[0]}/upload/${transformString}/${parts[1]}`;

    // Save transformation for future use
    image.transformations.push({
      name: dto.name,
      url: transformedUrl,
      width: dto.width,
      height: dto.height,
      transformation: transformString,
    });

    await image.save();

    return { url: transformedUrl };
  }

  /**
   * Delete image permanently
   * Only allowed if refCount = 0
   */
  async deleteImage(imageId: string): Promise<void> {
    const image = await Image.findById(imageId);

    if (!image) {
      throw new NotFoundError('Image not found');
    }

    if (image.refCount > 0) {
      throw new BadRequestError(
        `Cannot delete image. It is used by ${image.refCount} entities. Remove all references first.`
      );
    }

    // Delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(image.cloudinaryPublicId);
    } catch (error) {
      console.error(
        `Failed to delete from Cloudinary: ${image.cloudinaryPublicId}`,
        error
      );
    }

    // Delete from DB
    await image.deleteOne();
  }

  /**
   * Cleanup unused images (refCount = 0 and older than X days)
   */
  async cleanupUnusedImages(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const unusedImages = await Image.find({
      refCount: 0,
      createdAt: { $lt: cutoffDate },
    });

    let deletedCount = 0;

    for (const image of unusedImages) {
      try {
        await cloudinary.uploader.destroy(image.cloudinaryPublicId);
        await image.deleteOne();
        deletedCount++;
      } catch (error) {
        console.error(`Failed to cleanup image ${image._id}:`, error);
      }
    }

    return deletedCount;
  }

  /**
   * Get images used by specific entity
   */
  async getImagesByEntity(
    entityType: string,
    entityId: string
  ): Promise<ImageResponseDto[]> {
    const images = await Image.find({
      'usedBy.entityType': entityType,
      'usedBy.entityId': entityId,
    }).lean();

    return images as unknown as ImageResponseDto[];
  }
}

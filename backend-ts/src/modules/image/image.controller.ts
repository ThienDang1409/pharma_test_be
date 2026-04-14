import { Response } from 'express';
import { ImageService } from './image.service';
import { IAuthRequest } from '../../common/types';
import {
  UploadImageDto,
  UpdateImageDto,
  ImageQueryDto,
  AddReferenceDto,
  RemoveReferenceDto,
  TransformImageDto,
} from './image.dto';
import { asyncHandler } from '../../common/middleware';
import { BadRequestError } from '../../common/exceptions';

const imageService = new ImageService();

const toParamString = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? (value[0] ?? '') : (value ?? '');

// @desc    Upload single image
// @route   POST /api/images/upload
// @access  Private
export const uploadImage = asyncHandler(
  async (req: IAuthRequest, res: Response): Promise<void> => {
    if (!req.file) {
      throw new BadRequestError('No file uploaded');
    }

    const userId = req.user?.userId!;
    const dto: UploadImageDto = req.body;

    const image = await imageService.uploadImage(req.file, userId, dto);

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Image uploaded successfully',
      data: { image },
    });
  }
);

// @desc    Upload multiple images
// @route   POST /api/images/upload-multiple
// @access  Private
export const uploadMultiple = asyncHandler(
  async (req: IAuthRequest, res: Response): Promise<void> => {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      throw new BadRequestError('No files uploaded');
    }

    const userId = req.user?.userId!;
    const dto: UploadImageDto = req.body;

    const images = await imageService.uploadMultiple(req.files, userId, dto);

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: `${images.length} images uploaded successfully`,
      data: { images },
    });
  }
);

// @desc    Get all images
// @route   GET /api/images
// @access  Private
export const getAllImages = asyncHandler(
  async (req: IAuthRequest, res: Response): Promise<void> => {
    const query: ImageQueryDto = req.query as any;
    const result = await imageService.getAllImages(query);

    res.status(200).json({
      success: true,
      statusCode: 200,
      data: result,
    });
  }
);

// @desc    Get image by ID
// @route   GET /api/images/:id
// @access  Private
export const getImageById = asyncHandler(
  async (req: IAuthRequest, res: Response): Promise<void> => {
    const image = await imageService.getImageById(toParamString(req.params.id));

    res.status(200).json({
      success: true,
      statusCode: 200,
      data: { image },
    });
  }
);

// @desc    Update image metadata
// @route   PUT /api/images/:id
// @access  Private
export const updateImage = asyncHandler(
  async (req: IAuthRequest, res: Response): Promise<void> => {
    const dto: UpdateImageDto = req.body;
    const image = await imageService.updateImage(toParamString(req.params.id), dto);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Image updated successfully',
      data: { image },
    });
  }
);

// @desc    Add reference to image
// @route   POST /api/images/:id/reference
// @access  Private
export const addReference = asyncHandler(
  async (req: IAuthRequest, res: Response): Promise<void> => {
    const dto: AddReferenceDto = req.body;
    const image = await imageService.addReference(toParamString(req.params.id), dto);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Reference added successfully',
      data: { image },
    });
  }
);

// @desc    Remove reference from image
// @route   DELETE /api/images/:id/reference
// @access  Private
export const removeReference = asyncHandler(
  async (req: IAuthRequest, res: Response): Promise<void> => {
    const dto: RemoveReferenceDto = req.body;
    const result = await imageService.removeReference(toParamString(req.params.id), dto);

    if (result.deleted) {
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Image deleted (no more references)',
      });
    } else {
      res.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Reference removed successfully',
        data: { image: result.image },
      });
    }
  }
);

// @desc    Get or create image transformation
// @route   POST /api/images/:id/transform
// @access  Private
export const transformImage = asyncHandler(
  async (req: IAuthRequest, res: Response): Promise<void> => {
    const dto: TransformImageDto = req.body;
    const result = await imageService.transformImage(toParamString(req.params.id), dto);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Transformation generated successfully',
      data: result,
    });
  }
);

// @desc    Delete image permanently
// @route   DELETE /api/images/:id
// @access  Private/Admin
export const deleteImage = asyncHandler(
  async (req: IAuthRequest, res: Response): Promise<void> => {
    await imageService.deleteImage(toParamString(req.params.id));

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Image deleted successfully',
    });
  }
);

// @desc    Cleanup unused images
// @route   POST /api/images/cleanup
// @access  Private/Admin
export const cleanupUnused = asyncHandler(
  async (req: IAuthRequest, res: Response): Promise<void> => {
    const daysOld = parseInt(req.query.daysOld as string) || 30;
    const deletedCount = await imageService.cleanupUnusedImages(daysOld);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: `Cleaned up ${deletedCount} unused images`,
      data: { deletedCount },
    });
  }
);

// @desc    Get images by entity
// @route   GET /api/images/entity/:entityType/:entityId
// @access  Private
export const getImagesByEntity = asyncHandler(
  async (req: IAuthRequest, res: Response): Promise<void> => {
    const entityType = toParamString(req.params.entityType);
    const entityId = toParamString(req.params.entityId);
    const images = await imageService.getImagesByEntity(entityType, entityId);

    res.status(200).json({
      success: true,
      statusCode: 200,
      data: { images },
    });
  }
);

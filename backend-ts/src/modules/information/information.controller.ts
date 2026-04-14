import { Response } from 'express';
import { InformationService } from './information.service';
import { IAuthRequest } from '../../common/types';
import {
  CreateInformationDto,
  UpdateInformationDto,
  InformationQueryDto,
} from './information.dto';
import { asyncHandler } from '../../common/middleware';

const informationService = new InformationService();

const toParamString = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? (value[0] ?? '') : (value ?? '');

// @desc    Get all information
// @route   GET /api/information
// @access  Public
export const getAllInformation = asyncHandler(
  async (req: IAuthRequest, res: Response): Promise<void> => {
    const query: InformationQueryDto = req.query as any;
    const result = await informationService.getAllInformation(query);

    res.status(200).json({
      success: true,
      statusCode: 200,
      data: result,
    });
  }
);

// @desc    Get information tree
// @route   GET /api/information/tree
// @access  Public
export const getInformationTree = asyncHandler(
  async (req: IAuthRequest, res: Response): Promise<void> => {
    const { isActive } = req.query;
    const tree = await informationService.getTree(
      isActive === 'true' ? true : isActive === 'false' ? false : undefined
    );

    res.status(200).json({
      success: true,
      statusCode: 200,
      data: { tree },
    });
  }
);

// @desc    Get information by ID
// @route   GET /api/information/:id
// @access  Public
export const getInformationById = asyncHandler(
  async (req: IAuthRequest, res: Response): Promise<void> => {
    const information = await informationService.getInformationById(
      toParamString(req.params.id)
    );

    res.status(200).json({
      success: true,
      statusCode: 200,
      data: { information },
    });
  }
);

// @desc    Get information by slug
// @route   GET /api/information/slug/:slug
// @access  Public
export const getInformationBySlug = asyncHandler(
  async (req: IAuthRequest, res: Response): Promise<void> => {
    const information = await informationService.getInformationBySlug(
      toParamString(req.params.slug)
    );

    res.status(200).json({
      success: true,
      statusCode: 200,
      data: { information },
    });
  }
);

// @desc    Get children of a category
// @route   GET /api/information/:id/children
// @access  Public
export const getChildren = asyncHandler(
  async (req: IAuthRequest, res: Response): Promise<void> => {
    const children = await informationService.getChildren(toParamString(req.params.id));

    res.status(200).json({
      success: true,
      statusCode: 200,
      data: { children },
    });
  }
);

// @desc    Create information
// @route   POST /api/information
// @access  Private/Admin
export const createInformation = asyncHandler(
  async (req: IAuthRequest, res: Response): Promise<void> => {
    const data: CreateInformationDto = req.body;
    const information = await informationService.createInformation(data);

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Information created successfully',
      data: { information },
    });
  }
);

// @desc    Update information
// @route   PUT /api/information/:id
// @access  Private/Admin
export const updateInformation = asyncHandler(
  async (req: IAuthRequest, res: Response): Promise<void> => {
    const data: UpdateInformationDto = req.body;
    const information = await informationService.updateInformation(
      toParamString(req.params.id),
      data
    );

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Information updated successfully',
      data: { information },
    });
  }
);

// @desc    Delete information
// @route   DELETE /api/information/:id
// @access  Private/Admin
export const deleteInformation = asyncHandler(
  async (req: IAuthRequest, res: Response): Promise<void> => {
    await informationService.deleteInformation(toParamString(req.params.id));

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Information deleted successfully',
    });
  }
);

// @desc    Reorder information
// @route   PUT /api/information/reorder
// @access  Private/Admin
export const reorderInformation = asyncHandler(
  async (req: IAuthRequest, res: Response): Promise<void> => {
    const { items } = req.body;
    await informationService.reorderInformation(items);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Information reordered successfully',
    });
  }
);

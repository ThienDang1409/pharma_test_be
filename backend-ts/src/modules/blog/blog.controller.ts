import { Response, NextFunction } from 'express';
import { BlogService } from './blog.service';
import { IAuthRequest } from '../../common/types';
import { CreateBlogDto, UpdateBlogDto, BlogQueryDto } from './blog.dto';
import { asyncHandler } from '../../common/middleware';

const blogService = new BlogService();

// @desc    Get all blogs
// @route   GET /api/blogs
// @access  Public
export const getAllBlogs = asyncHandler(async (
  req: IAuthRequest,
  res: Response,
): Promise<void> => {
  const query: BlogQueryDto = req.query as any;
  const result = await blogService.getAllBlogs(query);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Blogs retrieved successfully',
    data: result,
  });
});

// @desc    Get blogs for exact category only (no descendant categories)
// @route   GET /api/blogs/exact-category?informationId=xxx
// @access  Public
export const getAllBlogsExactCategory = asyncHandler(async (
  req: IAuthRequest,
  res: Response,
): Promise<void> => {
  const query: BlogQueryDto = req.query as any;
  const result = await blogService.getAllBlogsExactCategory(query);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Blogs for exact category retrieved successfully',
    data: result,
  });
});

// @desc    Get single blog by ID
// @route   GET /api/blogs/:id?lang=vi
// @access  Public
export const getBlogById = asyncHandler(async (
  req: IAuthRequest,
  res: Response,
): Promise<void> => {
  const blog = await blogService.getBlogById(req.params.id as string);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Blog retrieved successfully',
    data: { blog },
  });
});

// @desc    Get single blog by slug
// @route   GET /api/blogs/slug/:slug?lang=vi
// @access  Public
export const getBlogBySlug = asyncHandler(async (
  req: IAuthRequest,
  res: Response,
): Promise<void> => {
  const blog = await blogService.getBlogBySlug(req.params.slug as string);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Blog retrieved successfully',
    data: { blog },
  });
});

// @desc    Create new blog
// @route   POST /api/blogs
// @access  Private/Admin
export const createBlog = asyncHandler(async (
  req: IAuthRequest,
  res: Response,
): Promise<void> => {
  const data: CreateBlogDto = req.body;
  const blog = await blogService.createBlog(data);

  res.status(201).json({
    success: true,
    statusCode: 201,
    message: 'Blog created successfully',
    data: { blog },
  });
});

// @desc    Update blog
// @route   PUT /api/blogs/:id
// @access  Private/Admin
export const updateBlog = asyncHandler(async (
  req: IAuthRequest,
  res: Response,
): Promise<void> => {
  const data: UpdateBlogDto = req.body;
  const blog = await blogService.updateBlog(req.params.id as string, data);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Blog updated successfully',
    data: { blog },
  });
});

// @desc    Delete blog
// @route   DELETE /api/blogs/:id
// @access  Private/Admin
export const deleteBlog = asyncHandler(async (
  req: IAuthRequest,
  res: Response,
): Promise<void> => {
  await blogService.deleteBlog(req.params.id as string);

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Blog deleted successfully',
  });
});

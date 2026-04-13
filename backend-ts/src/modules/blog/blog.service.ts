import Blog from './blog.model';
import { IBlog } from './blog.interface';
import { CreateBlogDto, UpdateBlogDto, BlogQueryDto, BlogResponseDto, BlogListItemDto } from './blog.dto';
import { NotFoundError, BadRequestError } from '../../common/exceptions';
import { IPaginationResult } from '../../common/types';
import { generateSlug, generateUniqueSlug, getImageChanges, getUniqueImageIds } from '../../common/utils';
import mongoose from 'mongoose';
import { DEFAULTS, BLOG_STATUS, ERROR_MESSAGES } from '../../common/constants';
import { ImageService } from '../image/image.service';
import { logger } from '../../common/logger';
import Information from '../information/information.model';

export class BlogService {
  /**
   * Get all descendant IDs of a category (including itself)
   */
  private async getAllDescendantCategoryIds(categoryId: string): Promise<string[]> {
    const categoryIds = [categoryId];
    const allCategories = await Information.find({}).lean();
    
    const getDescendants = (id: string): string[] => {
      const children = allCategories
        .filter((cat: any) => cat.parentId === id)
        .map((cat: any) => cat._id.toString());
      
      return children.concat(children.flatMap((childId) => getDescendants(childId)));
    };

    categoryIds.push(...getDescendants(categoryId));
    return categoryIds;
  }

  // Get all blogs with pagination and filters (lightweight - no sections)
  async getAllBlogs(query: BlogQueryDto): Promise<IPaginationResult<BlogListItemDto>> {
    const { page = DEFAULTS.PAGINATION_PAGE.toString(), limit = DEFAULTS.PAGINATION_LIMIT.toString(), status, isProduct, search, tags, informationId, includeDescendants = 'true' } = query;

    // Build query
    const queryFilter: any = {};
    if (status) queryFilter.status = status;
    if (isProduct !== undefined) queryFilter.isProduct = isProduct === 'true';
    
    // Handle hierarchical category filtering
    if (informationId) {
      if (includeDescendants === 'true') {
        // Include all descendant categories
        const categoryIds = await this.getAllDescendantCategoryIds(informationId);
        queryFilter.informationId = { $in: categoryIds };
      } else {
        // Exact category only
        queryFilter.informationId = informationId;
      }
    }
    
    if (search) {
      queryFilter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { title_en: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { excerpt_en: { $regex: search, $options: 'i' } },
      ];
    }
    if (tags) {
      queryFilter.tags = { $in: tags.split(',') };
    }

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 10));

    // Execute query with pagination
    const blogs = await Blog.find(queryFilter)
      .populate({
        path: 'image',
        select: 'cloudinaryUrl cloudinaryPublicId _id',
      })
      .populate({
        path: 'informationId',
        select: 'name name_en slug _id',
      })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .sort({ createdAt: -1 });

    const count = await Blog.countDocuments(queryFilter);

    return {
      items: blogs.map((blog) => this.mapToListItemDto(blog)),
      totalPages: Math.ceil(count / limitNum),
      currentPage: pageNum,
      total: count,
    };
  }

  // Get blogs for exact category only (no descendant categories)
  async getAllBlogsExactCategory(query: BlogQueryDto): Promise<IPaginationResult<BlogListItemDto>> {
    const { page = DEFAULTS.PAGINATION_PAGE.toString(), limit = DEFAULTS.PAGINATION_LIMIT.toString(), status, isProduct, search, tags, informationId } = query;

    if (!informationId) {
      throw new BadRequestError('informationId is required for exact category query');
    }

    // Build query - only exact category
    const queryFilter: any = {
      informationId: informationId,
    };
    if (status) queryFilter.status = status;
    if (isProduct !== undefined) queryFilter.isProduct = isProduct === 'true';
    
    if (search) {
      queryFilter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { title_en: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { excerpt_en: { $regex: search, $options: 'i' } },
      ];
    }
    if (tags) {
      queryFilter.tags = { $in: tags.split(',') };
    }

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 10));

    // Execute query with pagination
    const blogs = await Blog.find(queryFilter)
      .populate({
        path: 'image',
        select: 'cloudinaryUrl cloudinaryPublicId _id',
      })
      .populate({
        path: 'informationId',
        select: 'name name_en slug _id',
      })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .sort({ createdAt: -1 });

    const count = await Blog.countDocuments(queryFilter);

    return {
      items: blogs.map((blog) => this.mapToListItemDto(blog)),
      totalPages: Math.ceil(count / limitNum),
      currentPage: pageNum,
      total: count,
    };
  }

  // Get single blog by ID
  async getBlogById(id: string): Promise<BlogResponseDto> {
    const blog = await Blog.findById(id)
      .populate({
        path: 'image',
        select: 'cloudinaryUrl cloudinaryPublicId _id',
      })
      .populate({
        path: 'informationId',
        select: 'name name_en slug _id',
      });

    if (!blog) {
      throw new NotFoundError(ERROR_MESSAGES.BLOG_NOT_FOUND);
    }

    return this.mapToResponseDto(blog);
  }

  // Get single blog by slug
  async getBlogBySlug(slug: string): Promise<BlogResponseDto> {
    const blog = await Blog.findOne({ slug })
      .populate({
        path: 'image',
        select: 'cloudinaryUrl cloudinaryPublicId _id',
      })
      .populate({
        path: 'informationId',
        select: 'name name_en slug _id',
      });

    if (!blog) {
      throw new NotFoundError(ERROR_MESSAGES.BLOG_NOT_FOUND);
    }

    return this.mapToResponseDto(blog);
  }

  // Create new blog
  async createBlog(data: CreateBlogDto): Promise<BlogResponseDto> {
    if (!data.title || !data.informationId) {
      throw new BadRequestError(ERROR_MESSAGES.TITLE_REQUIRED);
    }

    // Sanitize empty strings to null for ObjectId fields
    if (data.image === '') data.image = undefined;

    // Generate slug from title
    const baseSlug = generateSlug(data.title);
    const uniqueSlug = await generateUniqueSlug(baseSlug, Blog);

    const session = await mongoose.startSession();
    let createdBlog: any;

    try {
      await session.withTransaction(async () => {
        // Process sections to ensure slugs exist
        const processedSections = data.sections?.map(sec => ({
          ...sec,
          slug: sec.slug || generateSlug(sec.title)
        }));

        // Create blog
        const blogs = await Blog.create([{
          ...data,
          sections: processedSections,
          slug: uniqueSlug,
        }], { session });
        
        createdBlog = blogs[0];

        // Add image references if image provided
        if (data.image) {
          const imageService = new ImageService();
          await imageService.addReference(data.image, {
            entityType: 'blog',
            entityId: createdBlog._id.toString(),
            field: 'image',
          }, session);
        }
      });
    } catch (error) {
      logger.error('Failed to create blog with transaction:', error);
      throw error;
    } finally {
      await session.endSession();
    }

    return this.mapToResponseDto(createdBlog);
  }

  // Update blog
  async updateBlog(id: string, data: UpdateBlogDto): Promise<BlogResponseDto> {
    const blog = await Blog.findById(id);

    if (!blog) {
      throw new NotFoundError(ERROR_MESSAGES.BLOG_NOT_FOUND);
    }

    // Sanitize empty strings to null for ObjectId fields
    if (data.image === '') data.image = undefined;

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        // Handle image reference changes
        if (data.image !== undefined) {
          const imageService = new ImageService();
          const oldImage = blog.image as unknown as string; // image is populated or objectid string
          const newImage = data.image;

          // If image changed, update references
          if (oldImage !== newImage) {
            // Remove old reference
            if (oldImage && typeof oldImage === 'string') {
              await imageService.removeReference(oldImage, {
                entityType: 'blog',
                entityId: id,
                field: 'image',
              }, session);
            }

            // Add new reference
            if (newImage && typeof newImage === 'string') {
              await imageService.addReference(newImage, {
                entityType: 'blog',
                entityId: id,
                field: 'image',
              }, session);
            }
          }
        }

        // If title changed, regenerate slug
        if (data.title && data.title !== blog.title) {
          const baseSlug = generateSlug(data.title);
          const uniqueSlug = await generateUniqueSlug(baseSlug, Blog, id);
          blog.slug = uniqueSlug;
        }

        // Update fields
        if (data.title !== undefined) blog.title = data.title;
        if (data.title_en !== undefined) blog.title_en = data.title_en;
        if (data.author !== undefined) blog.author = data.author;
        if (data.image !== undefined) blog.image = data.image as any;
        if (data.excerpt !== undefined) blog.excerpt = data.excerpt;
        if (data.excerpt_en !== undefined) blog.excerpt_en = data.excerpt_en;
        if (data.informationId !== undefined) blog.informationId = data.informationId as any;
        if (data.tags !== undefined) blog.tags = data.tags;
        
        if (data.sections !== undefined) {
          blog.sections = data.sections.map(sec => ({
            ...sec,
            slug: sec.slug || generateSlug(sec.title)
          }));
        }
        
        if (data.isProduct !== undefined) blog.isProduct = data.isProduct;
        if (data.status !== undefined) {
          blog.status = data.status;
          if (data.status === 'published' && !blog.publishedAt) {
            blog.publishedAt = new Date();
          }
        }

        await blog.save({ session });
      });
    } catch (error) {
      logger.error(`Failed to update blog ${id} with transaction:`, error);
      throw error;
    } finally {
      await session.endSession();
    }

    return this.mapToResponseDto(blog);
  }

  // Delete blog
  async deleteBlog(id: string): Promise<void> {
    const blog = await Blog.findById(id);

    if (!blog) {
      throw new NotFoundError(ERROR_MESSAGES.BLOG_NOT_FOUND);
    }

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        // Remove image references before deleting
        if (blog.image) {
          const imageService = new ImageService();
          await imageService.removeReference(blog.image as unknown as string, {
            entityType: 'blog',
            entityId: id,
            field: 'image',
          }, session);
          // Image will be auto-deleted from Cloudinary if refCount reaches 0
        }

        await Blog.deleteOne({ _id: id }, { session });
      });
    } catch (error) {
      logger.error(`Failed to delete blog ${id} with transaction:`, error);
      throw error;
    } finally {
      await session.endSession();
    }
  }

  // Helper: Map blog to list item DTO (lightweight - no sections)
  private mapToListItemDto(blog: IBlog): BlogListItemDto {
    return {
      id: blog._id.toString(),
      title: blog.title,
      title_en: blog.title_en,
      slug: blog.slug,
      author: blog.author,
      image: blog.image as any,
      excerpt: blog.excerpt,
      excerpt_en: blog.excerpt_en,
      informationId: blog.informationId,
      tags: blog.tags,
      isProduct: blog.isProduct,
      status: blog.status,
      publishedAt: blog.publishedAt,
      createdAt: blog.createdAt,
      updatedAt: blog.updatedAt,
    };
  }

  // Helper: Map blog to full response DTO (includes sections)
  private mapToResponseDto(blog: IBlog): BlogResponseDto {
    return {
      ...this.mapToListItemDto(blog),
      sections: blog.sections,
    };
  }
}

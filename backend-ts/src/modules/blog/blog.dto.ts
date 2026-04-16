import { ISection } from './blog.interface';

// Image preview DTO (lightweight)
export interface ImagePreviewDto {
  _id: string;
  cloudinaryUrl: string;
  cloudinaryPublicId: string;
}

// Information preview DTO (lightweight)
export interface InformationPreviewDto {
  _id: string;
  name: string;
  name_en: string;
  slug: string;
}

// Blog DTOs (Data Transfer Objects)

export interface CreateBlogDto {
  title: string;
  title_en?: string;
  author?: string;
  image?: string;
  excerpt?: string;
  excerpt_en?: string;
  informationId: string;
  tags?: string[];
  sections?: ISection[];
  isProduct?: boolean;
  status?: 'draft' | 'published';
}

export interface UpdateBlogDto {
  title?: string;
  title_en?: string;
  author?: string;
  image?: string | null;
  excerpt?: string;
  excerpt_en?: string;
  informationId?: string;
  tags?: string[];
  sections?: ISection[];
  isProduct?: boolean;
  status?: 'draft' | 'published';
}

export interface BlogQueryDto {
  page?: string;
  limit?: string;
  status?: 'draft' | 'published';
  isProduct?: string;
  search?: string;
  tags?: string;
  informationId?: string;
  includeDescendants?: string;
}

/**
 * Lightweight DTO for list views (no sections for performance)
 */
export interface BlogListItemDto {
  id: string;
  title: string;
  title_en?: string;
  slug: string;
  author: string;
  image?: ImagePreviewDto | null;
  excerpt?: string;
  excerpt_en?: string;
  informationId: InformationPreviewDto | string;
  tags: string[];
  isProduct: boolean;
  status: 'draft' | 'published';
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Full DTO for detail views (includes sections)
 */
export interface BlogResponseDto extends BlogListItemDto {
  sections: ISection[];
}

import Blog from '../blog/blog.model';
import Image from '../image/image.model';
import Information from '../information/information.model';
import { BLOG_STATUS } from '../../common/constants';

export interface DashboardOverviewDto {
  totalCategories: number;
  totalBlogs: number;
  publishedBlogs: number;
  draftBlogs: number;
  totalImages: number;
  unusedImages: number;
}

export class DashboardService {
  async getOverview(): Promise<DashboardOverviewDto> {
    const rootCategoryFilter = {
      $or: [
        { parentId: null },
        { parentId: '' },
        { parentId: 'null' },
        { parentId: { $exists: false } },
      ],
    };

    const [
      totalCategories,
      totalBlogs,
      publishedBlogs,
      draftBlogs,
      totalImages,
      unusedImages,
    ] = await Promise.all([
      Information.countDocuments(rootCategoryFilter),
      Blog.countDocuments({}),
      Blog.countDocuments({ status: BLOG_STATUS.PUBLISHED }),
      Blog.countDocuments({ status: BLOG_STATUS.DRAFT }),
      Image.countDocuments({}),
      Image.countDocuments({ refCount: 0 }),
    ]);

    return {
      totalCategories,
      totalBlogs,
      publishedBlogs,
      draftBlogs,
      totalImages,
      unusedImages,
    };
  }
}

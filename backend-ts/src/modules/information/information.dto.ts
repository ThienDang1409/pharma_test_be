// Image preview DTO (lightweight)
export interface ImagePreviewDto {
  _id: string;
  cloudinaryUrl: string;
  cloudinaryPublicId: string;
}

export interface CreateInformationDto {
  name: string;
  name_en: string;
  description?: string;
  description_en?: string;
  image?: string;
  parentId?: string | null;
  order?: number;
  isActive?: boolean;
  showInMenu?: boolean;
  dropdownType?: 'children' | 'blogs' | 'none';
  includeSelfInDropdown?: boolean;
  menuOrder?: number;
}

export interface UpdateInformationDto {
  name?: string;
  name_en?: string;
  description?: string;
  description_en?: string;
  image?: string;
  parentId?: string | null;
  order?: number;
  isActive?: boolean;
  showInMenu?: boolean;
  dropdownType?: 'children' | 'blogs' | 'none';
  includeSelfInDropdown?: boolean;
  menuOrder?: number;
}

export interface InformationQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  parentId?: string | null;
  isActive?: boolean;
  lang?: 'vi' | 'en';
}

export interface InformationResponseDto {
  _id: string;
  name: string;
  name_en: string;
  slug: string;
  description?: string;
  description_en?: string;
  image?: ImagePreviewDto | null;
  parentId?: string | null;
  order: number;
  isActive: boolean;
  showInMenu: boolean;
  dropdownType: 'children' | 'blogs' | 'none';
  includeSelfInDropdown: boolean;
  menuOrder: number;
  children?: InformationResponseDto[];
  createdAt: Date;
  updatedAt: Date;
}

export interface InformationTreeDto extends InformationResponseDto {
  children: InformationTreeDto[];
}

export interface InformationNavigationDto {
  _id: string;
  name: string;
  name_en: string;
  slug: string;
  dropdownType: 'children' | 'blogs' | 'none';
  items: Array<{
    _id: string;
    name: string;
    name_en: string;
    slug: string;
    type: 'category' | 'blog';
  }>;
}

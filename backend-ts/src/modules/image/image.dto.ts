export interface UploadImageDto {
  tags?: string[];
  description?: string;
  folder?: string;
  entityType?: 'blog' | 'user' | 'information' | 'other';
  entityId?: string;
  field?: string;
}

export interface UpdateImageDto {
  tags?: string[];
  description?: string;
}

export interface ImageResponseDto {
  _id: string;
  cloudinaryUrl: string;
  cloudinaryPublicId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  width?: number;
  height?: number;
  format?: string;
  folder: string;
  fileHash: string;
  refCount: number;
  usedBy: {
    entityType: string;
    entityId: string;
    field: string;
    addedAt: Date;
  }[];
  transformations: {
    name: string;
    url: string;
    width?: number;
    height?: number;
  }[];
  tags?: string[];
  description?: string;
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ImageQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  tags?: string;
  folder?: string;
  entityType?: string;
  entityId?: string;
  uploadedBy?: string;
  unusedOnly?: boolean; // refCount = 0
}

export interface AddReferenceDto {
  entityType: 'blog' | 'user' | 'information' | 'other';
  entityId: string;
  field: string;
}

export interface RemoveReferenceDto {
  entityType: 'blog' | 'user' | 'information' | 'other';
  entityId: string;
  field?: string; // optional - if not provided, remove all references for this entity
}

export interface TransformImageDto {
  name: string; // transformation preset name
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'scale' | 'limit' | 'pad' | 'thumb';
  quality?: number;
  format?: 'jpg' | 'png' | 'webp' | 'avif';
  gravity?: 'auto' | 'face' | 'center' | 'north' | 'south' | 'east' | 'west';
}

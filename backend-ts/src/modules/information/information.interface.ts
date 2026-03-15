import { Document, Types } from 'mongoose';

export interface IInformation extends Document {
  name: string;
  name_en: string;
  slug: string;
  description?: string;
  description_en?: string;
  image?: any;  // ObjectId reference to Image // Image ID from Image collection
  parentId?: string | null;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

import { Document } from 'mongoose';

export interface ISection {
  title: string;
  title_en?: string;
  slug: string;
  type: string;
  content: string;
  content_en?: string;
}

export interface IBlog extends Document {
  title: string;
  title_en?: string;
  slug: string;
  author: string;
  image: any;  // ObjectId reference to Image
  excerpt?: string;
  excerpt_en?: string;
  informationId: any; // ObjectId reference to Information
  tags: string[];
  sections: ISection[];
  isProduct: boolean;
  status: 'draft' | 'published';
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

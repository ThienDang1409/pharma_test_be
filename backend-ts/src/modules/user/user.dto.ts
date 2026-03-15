export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: 'user' | 'admin';
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  role?: 'user' | 'admin';
  isActive?: boolean;
  phone?: string;
  avatar?: string;
}

export interface UpdateProfileDto {
  name?: string;
  phone?: string;
  avatar?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface UserQueryDto {
  page?: string;
  limit?: string;
  role?: 'user' | 'admin';
  isActive?: string;
  search?: string;
}

export interface UserResponseDto {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  avatar?: string;
  phone?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface AuthResponseDto {
  user: UserResponseDto;
  accessToken: string;
  refreshToken: string;
}

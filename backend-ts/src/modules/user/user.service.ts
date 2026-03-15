import User from './user.model';
import { IUser } from './user.interface';
import {
  CreateUserDto,
  UpdateUserDto,
  UpdateProfileDto,
  ChangePasswordDto,
  UserQueryDto,
  UserResponseDto,
  LoginDto,
  RegisterDto,
  AuthResponseDto,
} from './user.dto';
import {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} from '../../common/exceptions';
import { IPaginationResult } from '../../common/types';
import { DEFAULTS, ERROR_MESSAGES } from '../../common/constants';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../../common/middleware';

export class UserService {
  // Register new user
  async register(data: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, name, phone } = data;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new BadRequestError('User with this email already exists');
    }

    // Create user
    const user = await User.create({
      email,
      password,
      name,
      phone,
      role: 'user',
    });

    // Generate tokens
    const accessToken = generateAccessToken(user._id.toString(), user.role);
    const refreshToken = generateRefreshToken(user._id.toString());

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    return {
      user: this.mapToResponseDto(user),
      accessToken,
      refreshToken,
    };
  }

  // Login user
  async login(data: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = data;

    // Find user with password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Check if active
    if (!user.isActive) {
      throw new UnauthorizedError(
        'Account is deactivated. Please contact administrator.'
      );
    }

    // Compare password
    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Update last login
    user.lastLogin = new Date();

    // Generate tokens
    const accessToken = generateAccessToken(user._id.toString(), user.role);
    const refreshToken = generateRefreshToken(user._id.toString());

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    return {
      user: this.mapToResponseDto(user),
      accessToken,
      refreshToken,
    };
  }

  // Refresh token
  async refreshToken(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    // Verify token
    const decoded = verifyRefreshToken(token);

    if (!decoded) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Find user
    const user = await User.findById(decoded.userId).select('+refreshToken');

    if (!user || user.refreshToken !== token) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(user._id.toString(), user.role);
    const newRefreshToken = generateRefreshToken(user._id.toString());

    // Update refresh token
    user.refreshToken = newRefreshToken;
    await user.save();

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  // Logout user
  async logout(userId: string): Promise<void> {
    const user = await User.findById(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Clear refresh token
    user.refreshToken = undefined;
    await user.save();
  }

  // Get current user
  async getMe(userId: string): Promise<UserResponseDto> {
    const user = await User.findById(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return this.mapToResponseDto(user);
  }

  // Update profile
  async updateProfile(userId: string, data: UpdateProfileDto): Promise<UserResponseDto> {
    const user = await User.findById(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Update fields
    if (data.name !== undefined) user.name = data.name;
    if (data.phone !== undefined) user.phone = data.phone;
    if (data.avatar !== undefined) user.avatar = data.avatar;

    await user.save();

    return this.mapToResponseDto(user);
  }

  // Change password
  async changePassword(userId: string, data: ChangePasswordDto): Promise<void> {
    const user = await User.findById(userId).select('+password');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify current password
    const isPasswordMatch = await user.comparePassword(data.currentPassword);

    if (!isPasswordMatch) {
      throw new BadRequestError('Current password is incorrect');
    }

    // Update password
    user.password = data.newPassword;
    await user.save();
  }

  // Get all users (Admin)
  async getAllUsers(query: UserQueryDto): Promise<IPaginationResult<UserResponseDto>> {
    const {
      page = DEFAULTS.PAGINATION_PAGE.toString(),
      limit = DEFAULTS.PAGINATION_LIMIT.toString(),
      role,
      isActive,
      search,
    } = query;

    // Build query
    const queryFilter: any = {};
    if (role) queryFilter.role = role;
    if (isActive !== undefined) queryFilter.isActive = isActive === 'true';
    if (search) {
      queryFilter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Execute query
    const users = await User.find(queryFilter)
      .select('-password -refreshToken -resetPasswordToken -resetPasswordExpires')
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .sort({ createdAt: -1 });

    const count = await User.countDocuments(queryFilter);

    return {
      items: users.map((user) => this.mapToResponseDto(user)),
      totalPages: Math.ceil(count / limitNum),
      currentPage: pageNum,
      total: count,
    };
  }

  // Get user by ID (Admin)
  async getUserById(id: string): Promise<UserResponseDto> {
    const user = await User.findById(id).select(
      '-password -refreshToken -resetPasswordToken -resetPasswordExpires'
    );

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return this.mapToResponseDto(user);
  }

  // Update user (Admin)
  async updateUser(id: string, data: UpdateUserDto): Promise<UserResponseDto> {
    const user = await User.findById(id);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Update fields
    if (data.name !== undefined) user.name = data.name;
    if (data.email !== undefined) user.email = data.email;
    if (data.role !== undefined) user.role = data.role;
    if (data.isActive !== undefined) user.isActive = data.isActive;
    if (data.phone !== undefined) user.phone = data.phone;
    if (data.avatar !== undefined) user.avatar = data.avatar;

    await user.save();

    return this.mapToResponseDto(user);
  }

  // Delete user (Admin)
  async deleteUser(id: string): Promise<void> {
    const user = await User.findById(id);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    await User.deleteOne({ _id: id });
  }

  // Helper: Map user to response DTO
  private mapToResponseDto(user: IUser): UserResponseDto {
    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      phone: user.phone,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

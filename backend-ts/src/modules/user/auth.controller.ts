import { Response } from 'express';
import { UserService } from './user.service';
import { IAuthRequest } from '../../common/types';
import {
  RegisterDto,
  LoginDto,
  UpdateProfileDto,
  ChangePasswordDto,
} from './user.dto';
import { asyncHandler } from '../../common/middleware';

const userService = new UserService();

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(
  async (req: IAuthRequest, res: Response): Promise<void> => {
    const data: RegisterDto = req.body;
    const result = await userService.register(data);

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'User registered successfully',
      data: result,
    });
  }
);

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(
  async (req: IAuthRequest, res: Response): Promise<void> => {
    const data: LoginDto = req.body;
    const result = await userService.login(data);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Login successful',
      data: result,
    });
  }
);

// @desc    Refresh token
// @route   POST /api/auth/refresh-token
// @access  Public
export const refreshToken = asyncHandler(
  async (req: IAuthRequest, res: Response): Promise<void> => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Refresh token is required',
      });
      return;
    }

    const tokens = await userService.refreshToken(refreshToken);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Token refreshed successfully',
      data: tokens,
    });
  }
);

// @desc    Request forgot password token
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = asyncHandler(
  async (req: IAuthRequest, res: Response): Promise<void> => {
    const { email } = req.body;
    const token = await userService.forgotPassword(email);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Password reset token created',
      data: { token },
    });
  }
);

// @desc    Reset password with token
// @route   PUT /api/auth/reset-password
// @access  Public
export const resetPassword = asyncHandler(
  async (req: IAuthRequest, res: Response): Promise<void> => {
    const { token, password } = req.body;
    await userService.resetPassword(token, password);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Password reset successfully',
    });
  }
);

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = asyncHandler(
  async (req: IAuthRequest, res: Response): Promise<void> => {
    const userId = req.user?.userId;

    await userService.logout(userId);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Logout successful',
    });
  }
);

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(
  async (req: IAuthRequest, res: Response): Promise<void> => {
    const userId = req.user?.userId;
    const user = await userService.getMe(userId);

    res.status(200).json({
      success: true,
      statusCode: 200,
      data: { user },
    });
  }
);

// @desc    Update profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = asyncHandler(
  async (req: IAuthRequest, res: Response): Promise<void> => {
    const userId = req.user?.userId;
    const data: UpdateProfileDto = req.body;
    const user = await userService.updateProfile(userId, data);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Profile updated successfully',
      data: { user },
    });
  }
);

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = asyncHandler(
  async (req: IAuthRequest, res: Response): Promise<void> => {
    const userId = req.user?.userId;
    const data: ChangePasswordDto = req.body;

    await userService.changePassword(userId, data);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Password changed successfully',
    });
  }
);

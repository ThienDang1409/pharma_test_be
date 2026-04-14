import { Response } from 'express';
import { UserService } from './user.service';
import { IAuthRequest } from '../../common/types';
import { UpdateUserDto, UserQueryDto } from './user.dto';
import { asyncHandler } from '../../common/middleware';

const userService = new UserService();

const toParamString = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? (value[0] ?? '') : (value ?? '');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
export const getAllUsers = asyncHandler(
  async (req: IAuthRequest, res: Response): Promise<void> => {
    const query: UserQueryDto = req.query as any;
    const result = await userService.getAllUsers(query);

    res.status(200).json({
      success: true,
      statusCode: 200,
      data: result,
    });
  }
);

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUserById = asyncHandler(
  async (req: IAuthRequest, res: Response): Promise<void> => {
    const user = await userService.getUserById(toParamString(req.params.id));

    res.status(200).json({
      success: true,
      statusCode: 200,
      data: { user },
    });
  }
);

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = asyncHandler(
  async (req: IAuthRequest, res: Response): Promise<void> => {
    const data: UpdateUserDto = req.body;
    const user = await userService.updateUser(toParamString(req.params.id), data);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'User updated successfully',
      data: { user },
    });
  }
);

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = asyncHandler(
  async (req: IAuthRequest, res: Response): Promise<void> => {
    await userService.deleteUser(toParamString(req.params.id));

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'User deleted successfully',
    });
  }
);

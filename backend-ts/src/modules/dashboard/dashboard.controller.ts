import { Response } from 'express';
import { asyncHandler } from '../../common/middleware';
import { IAuthRequest } from '../../common/types';
import { DashboardService } from './dashboard.service';

const dashboardService = new DashboardService();

export const getDashboardOverview = asyncHandler(async (
  req: IAuthRequest,
  res: Response
): Promise<void> => {
  const overview = await dashboardService.getOverview();

  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Dashboard overview retrieved successfully',
    data: { overview },
  });
});

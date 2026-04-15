import { Request, Response } from 'express';
import { asyncHandler } from '../../common/middleware';
import { ContactService } from './contact.service';
import { SubmitContactDto } from './contact.dto';

const contactService = new ContactService();

// @desc    Submit contact form
// @route   POST /api/contact
// @access  Public
export const submitContact = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const dto = req.body as SubmitContactDto;

    const result = await contactService.submitContact(dto, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent') || undefined,
      submittedAt: new Date(),
    });

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: result.delivered
        ? 'Contact request submitted successfully'
        : 'Contact request submitted. Mail delivery is pending configuration.',
      data: result,
    });
  }
);

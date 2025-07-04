import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { ApiError } from '../middleware/error.middleware';
import { getFileUrl } from '../middleware/upload.middleware';

/**
 * Upload a file
 */
export const uploadFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw new ApiError('No file uploaded', 400);
    }

    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError('User not authenticated', 401);
    }

    // Get file details from multer
    const { filename, originalname, mimetype, size } = req.file;

    // Generate file URL
    const fileUrl = getFileUrl(req, filename);

    // Return file details
    res.status(201).json({
      id: filename, // Using filename as ID for simplicity
      file_name: originalname,
      file_url: fileUrl,
      file_type: mimetype,
      uploaded_at: new Date(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Attach a file to a message
 */
export const attachFileToMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { messageId } = req.params;
    const { file_id } = req.body;

    if (!file_id) {
      throw new ApiError('File ID is required', 400);
    }

    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError('User not authenticated', 401);
    }

    // Check if message exists and belongs to user
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        stateNode: {
          conversation: {
            userId,
          },
        },
      },
    });

    if (!message) {
      throw new ApiError('Message not found or does not belong to user', 404);
    }

    // In a real app, you would validate that the file exists in your storage
    // For now, we'll just create the file reference with the given ID
    
    // Create file reference
    const fileReference = await prisma.fileReference.create({
      data: {
        messageId,
        fileName: req.body.file_name || 'Unknown file',
        fileUrl: req.body.file_url || `/uploads/${file_id}`,
        fileType: req.body.file_type || 'application/octet-stream',
      },
    });

    res.status(201).json({
      id: fileReference.id,
      message_id: fileReference.messageId,
      file_name: fileReference.fileName,
      file_url: fileReference.fileUrl,
      file_type: fileReference.fileType,
      uploaded_at: fileReference.uploadedAt,
    });
  } catch (error) {
    next(error);
  }
}; 
import { Router } from 'express';
import * as fileController from '../controllers/file.controller';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

// Apply authentication to all file routes
router.use(authenticate);

// Upload file
router.post('/', upload.single('file'), fileController.uploadFile);

// Attach file to message
router.post(
  '/attach/:messageId',
  fileController.attachFileToMessage
);

export default router;
import { Router } from 'express';
import { body } from 'express-validator';
import * as userController from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication to all user routes
router.use(authenticate);

// Get user preferences
router.get('/preferences', userController.getUserPreferences);

// Update user preferences
router.put(
  '/preferences',
  [
    body('theme').optional().isIn(['light', 'dark', 'system']),
    body('auto_scroll').optional().isBoolean(),
    body('collapse_settings.auto_collapse_prompts').optional().isBoolean(),
    body('collapse_settings.auto_collapse_empty_branches').optional().isBoolean()
  ],
  userController.updateUserPreferences
);

export default router;
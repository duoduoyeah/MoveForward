import { Router } from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/auth.controller';
import { Request, Response, NextFunction } from 'express';

const router = Router();

// Register a new user
router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
  ],
  (req: Request, res: Response, next: NextFunction) => authController.register(req, res, next)
);

// Login user
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  (req: Request, res: Response, next: NextFunction) => authController.login(req, res, next)
);

// Create anonymous session
router.post('/anonymous', (req: Request, res: Response, next: NextFunction) => 
  authController.createAnonymousSession(req, res, next)
);

// Logout
router.post('/logout', (req: Request, res: Response, next: NextFunction) => 
  authController.logout(req, res, next)
);

// Refresh access token
router.post('/refresh-token', (req: Request, res: Response, next: NextFunction) => 
  authController.refreshAccessToken(req, res, next)
);

export default router;
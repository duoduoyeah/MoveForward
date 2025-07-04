import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import prisma from '../utils/prisma';
import { ApiError } from '../middleware/error.middleware';

/**
 * Get user preferences
 */
export const getUserPreferences = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError('User not authenticated', 401);
    }

    // Get user with preferences
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    // If no preferences are set yet, return defaults
    const defaultPreferences = {
      theme: 'light',
      auto_scroll: false,
      collapse_settings: {
        auto_collapse_prompts: true,
        auto_collapse_empty_branches: true,
      },
    };

    // Return user preferences or defaults
    res.status(200).json(user.preferences || defaultPreferences);
  } catch (error) {
    next(error);
  }
};

/**
 * Update user preferences
 */
export const updateUserPreferences = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError('User not authenticated', 401);
    }

    const { theme, auto_scroll, collapse_settings } = req.body;

    // Get current preferences to merge with updates
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    // Merge existing preferences with new values
    const currentPreferences = (user.preferences as any) || {};
    
    const updatedPreferences = {
      ...currentPreferences,
      ...(theme !== undefined && { theme }),
      ...(auto_scroll !== undefined && { auto_scroll }),
      ...(collapse_settings && {
        collapse_settings: {
          ...(currentPreferences.collapse_settings || {}),
          ...collapse_settings,
        },
      }),
    };

    // Update user preferences
    await prisma.user.update({
      where: { id: userId },
      data: { preferences: updatedPreferences },
    });

    res.status(200).json(updatedPreferences);
  } catch (error) {
    next(error);
  }
};
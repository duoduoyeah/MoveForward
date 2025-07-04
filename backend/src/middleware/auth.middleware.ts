import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import { ApiError } from './error.middleware';
import { config } from '../config';
import { verifyAccessToken } from '../utils/token';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        authStatus?: string;
      };
    }
  }
}

/**
 * Authentication middleware to protect routes
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError('No token, authorization denied', 401);
    }

    // Verify token
    const token = authHeader.replace('Bearer ', '');
    
    try {
      const decoded = verifyAccessToken(token);
      
      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user) {
        throw new ApiError('User not found', 401);
      }

      // Add user to request object
      req.user = { id: decoded.id, authStatus: decoded.authStatus };
      next();
    } catch (err) {
      throw new ApiError('Token is not valid', 401);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Authorization middleware to check user roles
 */
export const authorize = (roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ApiError('Not authenticated', 401);
      }

      // Get user with role
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { role: true },
      });

      if (!user || !roles.includes(user.role)) {
        throw new ApiError('Not authorized to access this resource', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
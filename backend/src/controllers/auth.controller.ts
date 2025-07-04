import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../utils/prisma';
import { ApiError } from '../middleware/error.middleware';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/token';
import { config } from '../config';
import jwt from 'jsonwebtoken';

/**
 * Register a new user
 */
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ApiError('User already exists with that email', 400);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        authStatus: 'authenticated',
        role: 'user',
      },
    });

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.authStatus);
    const refreshToken = generateRefreshToken(user.id, user.authStatus);

    // Set refresh token as HTTP-only cookie
    res.cookie(config.refreshTokenCookieName, refreshToken, {
      httpOnly: true,
      secure: config.jwtCookieSecure,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });

    res.status(201).json({
      token: accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        lastLoginAt: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new ApiError('Invalid credentials', 401);
    }

    // Check if password exists
    if (user.authStatus === 'anonymous' || !user.password) {
      throw new ApiError('Invalid credentials', 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new ApiError('Invalid credentials', 401);
    }
    

    // Update last login
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.authStatus);
    const refreshToken = generateRefreshToken(user.id, user.authStatus);

    // Set refresh token as HTTP-only cookie
    res.cookie(config.refreshTokenCookieName, refreshToken, {
      httpOnly: true,
      secure: config.jwtCookieSecure,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });

    res.status(200).json({
      token: accessToken,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        lastLoginAt: updatedUser.lastLoginAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create an anonymous session
 */
export const createAnonymousSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Generate a session ID
    const sessionId = uuidv4();

    // Create anonymous user
    const user = await prisma.user.create({
      data: {
        name: `Anonymous ${sessionId.substring(0, 8)}`,
        authStatus: 'anonymous',
        sessionId,
      },
    });

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.authStatus);
    const refreshToken = generateRefreshToken(user.id, user.authStatus);

    // Set refresh token as HTTP-only cookie
    res.cookie(config.refreshTokenCookieName, refreshToken, {
      httpOnly: true,
      secure: config.jwtCookieSecure,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });

    res.status(200).json({
      token: accessToken,
      user: {
        id: user.id,
        sessionId: user.sessionId,
        authStatus: user.authStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout - invalidate token
 * Note: In a real app, you'd use a token blacklist or short-lived tokens
 */
export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // In a stateless JWT setup, the client just removes the token
    // Log the logout event for observability/debugging
    const userId = req.user?.id;
    const authStatus = req.user?.authStatus;
    
    console.log(`User logged out: ${userId} (${authStatus})`);
    
    // Clear the refresh token cookie
    res.clearCookie(config.refreshTokenCookieName);
    
    // Here we just send a success message
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const refreshAccessToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const refreshToken = req.cookies[config.refreshTokenCookieName];
    if (!refreshToken) {
      throw new ApiError('Refresh token not found', 401);
    }

    try {
      // Verify the refresh token
      const decoded = verifyRefreshToken(refreshToken);
      
      console.log(`Refreshed access token for user: ${decoded.id} (${decoded.authStatus})`);
      
      // Generate new access token only - don't rotate refresh token in stateless approach
      const accessToken = generateAccessToken(decoded.id, decoded.authStatus);

      // Return new access token
      res.status(200).json({
        token: accessToken,
      });
    } catch (error) {
      throw new ApiError('Invalid refresh token', 401);
    }
  } catch (error) {
    next(error);
  }
};

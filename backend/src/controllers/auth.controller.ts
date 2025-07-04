import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../utils/prisma';
import { ApiError } from '../middleware/error.middleware';
import { config } from '../config';

/**
 * Register a new user
 */
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
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

    // Generate JWT
    const token = generateToken(user.id);

    res.status(201).json({
      token,
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
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new ApiError('Invalid credentials', 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new ApiError('Invalid credentials', 401);
    }
    

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate JWT
    const token = generateToken(user.id);

    res.status(200).json({
      token,
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
 * Create an anonymous session
 */
export const createAnonymousSession = async (req: Request, res: Response, next: NextFunction) => {
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

    // Generate JWT
    const token = generateToken(user.id);

    res.status(200).json({
      token,
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
export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // In a stateless JWT setup, the client just removes the token
    // Here we just send a success message
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

/**
 * Generate JWT token
 */
const generateToken = (userId: string): string => {
  return jwt.sign({ id: userId }, config.jwtSecret, { expiresIn: config.jwtExpiration } as jwt.SignOptions);
};
import jwt from 'jsonwebtoken';
import { config } from '../config';

interface AccessTokenPayload {
  id: string;
  authStatus: string;
}

interface RefreshTokenPayload {
  id: string;
  authStatus: string;
}

export const generateAccessToken = (userId: string, authStatus: string): string => {
  return jwt.sign({ id: userId, authStatus }, config.jwtSecret, {
    expiresIn: config.jwtAccessExpiration,
  });
};

export const generateRefreshToken = (userId: string, authStatus: string): string => {
  return jwt.sign({ id: userId, authStatus }, config.jwtSecret, {
    expiresIn: config.jwtRefreshExpiration,
  });
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  return jwt.verify(token, config.jwtSecret) as AccessTokenPayload;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, config.jwtSecret) as RefreshTokenPayload;
};

import dotenv from 'dotenv';
dotenv.config();

function getEnvVar(key: string): string {
  const val = process.env[key];
  if (!val) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return val;
}

type JWTExpiration = `${number}${'s' | 'm' | 'h' | 'd'}`;

export const config = {
  jwtSecret: getEnvVar('JWT_SECRET'),
  port: process.env.PORT || '3000',
  jwtAccessExpiration: '15m' as JWTExpiration,
  jwtRefreshExpiration: '7d' as JWTExpiration,
  refreshTokenCookieName: 'refresh_token',
  jwtCookieSecure: process.env.NODE_ENV === 'production',
  // add more here later
};

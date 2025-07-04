import dotenv from 'dotenv';
dotenv.config();

function getEnvVar(key: string): string {
  const val = process.env[key];
  if (!val) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return val;
}

export const config = {
  jwtSecret: getEnvVar('JWT_SECRET'),
  port: process.env.PORT || '3000',
  jwtExpiration: process.env.JWT_EXPIRATION || '24h',
  // add more here later
};

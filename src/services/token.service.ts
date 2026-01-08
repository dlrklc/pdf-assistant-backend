import '../env';

import jwt from 'jsonwebtoken';

export interface TokenPayload {
  userId: string;
  username: string;
  email: string;
  role: string;
}

export interface TokenConfig {
  expiresIn?: string;
  useRefreshSecret?: boolean; // If true, use REFRESH_TOKEN_SECRET instead of ACCESS_TOKEN_SECRET
}

/**
 * Gets the JWT secret for access tokens from environment variables
 * @throws {Error} If ACCESS_TOKEN_SECRET is not set
 */
function getAccessTokenSecret(): string {
  const secret = process.env.ACCESS_TOKEN_SECRET;
  if (!secret) {
    throw new Error('Server configuration error: ACCESS_TOKEN_SECRET is not set');
  }
  return secret;
}

/**
 * Gets the JWT secret for refresh tokens from environment variables
 * @throws {Error} If REFRESH_TOKEN_SECRET is not set
 */
function getRefreshTokenSecret(): string {
  const secret = process.env.REFRESH_TOKEN_SECRET;
  if (!secret) {
    throw new Error('Server configuration error: REFRESH_TOKEN_SECRET is not set');
  }
  return secret;
}

/**
 * Gets the default token expiration time
 */
function getDefaultExpiration(): string {
  return process.env.JWT_EXPIRES_IN || '24h';
}

/**
 * Generates a JWT token with the provided payload
 * @param payload - The data to encode in the token
 * @param config - Optional token configuration (expiration, useRefreshSecret, etc.)
 * @returns The signed JWT token
 * @throws {Error} If required secret is not set
 */
export function generateToken(
  payload: TokenPayload,
  config?: TokenConfig
): string {
  const secret = config?.useRefreshSecret ? getRefreshTokenSecret() : getAccessTokenSecret();
  const expiresIn = config?.expiresIn || getDefaultExpiration();

  return jwt.sign(payload, secret, {
    expiresIn,
  } as jwt.SignOptions);
}

/**
 * Verifies and decodes a JWT token
 * @param token - The JWT token to verify
 * @param secret - Optional secret to use. If not provided, uses ACCESS_TOKEN_SECRET
 * @returns The decoded token payload
 * @throws {jwt.JsonWebTokenError} If token is invalid
 * @throws {jwt.TokenExpiredError} If token has expired
 * @throws {Error} If required secret is not set
 */
export function verifyToken(token: string, secret?: string): TokenPayload {
  const tokenSecret = secret || getAccessTokenSecret();
  const payload = jwt.verify(token, tokenSecret);

  // Type guard: ensure payload is an object, not a string
  if (typeof payload === 'string' || !payload) {
    throw new jwt.JsonWebTokenError('Invalid token payload');
  }

  const jwtPayload = payload as jwt.JwtPayload;

  // Validate required fields
  if (!jwtPayload.userId || !jwtPayload.username || !jwtPayload.email || !jwtPayload.role) {
    throw new jwt.JsonWebTokenError('Token payload missing required fields');
  }

  return {
    userId: jwtPayload.userId as string,
    username: jwtPayload.username as string,
    email: jwtPayload.email as string,
    role: jwtPayload.role as string,
  };
}


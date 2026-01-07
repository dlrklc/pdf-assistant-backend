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
}

/**
 * Gets the JWT secret from environment variables
 * @throws {Error} If ACCESS_TOKEN_SECRET is not set
 */
function getJwtSecret(): string {
  const secret = process.env.ACCESS_TOKEN_SECRET;
  if (!secret) {
    throw new Error('Server configuration error: ACCESS_TOKEN_SECRET is not set');
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
 * @param config - Optional token configuration (expiration, etc.)
 * @returns The signed JWT token
 * @throws {Error} If ACCESS_TOKEN_SECRET is not set
 */
export function generateToken(
  payload: TokenPayload,
  config?: TokenConfig
): string {
  const secret = getJwtSecret();
  const expiresIn = config?.expiresIn || getDefaultExpiration();

  return jwt.sign(payload, secret, {
    expiresIn,
  } as jwt.SignOptions);
}

/**
 * Verifies and decodes a JWT token
 * @param token - The JWT token to verify
 * @returns The decoded token payload
 * @throws {jwt.JsonWebTokenError} If token is invalid
 * @throws {jwt.TokenExpiredError} If token has expired
 * @throws {Error} If ACCESS_TOKEN_SECRET is not set
 */
export function verifyToken(token: string): TokenPayload {
  const secret = getJwtSecret();
  const payload = jwt.verify(token, secret);

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


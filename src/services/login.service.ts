import {
  findUserByEmailOrUsername,
  validatePassword,
  getUserWithoutPassword,
} from './user.service';
import { generateToken, verifyToken, decodeToken, TokenPayload } from './token.service';
import { isTokenBlacklisted, blacklistToken } from './token-blacklist.service';

export interface LoginCredentials {
  email?: string;
  username?: string;
  password: string;
}

export interface LoginResult {
  user: {
    userId: string;
    username: string;
    email: string;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validates login credentials and returns user data with JWT token
 * @throws {ValidationError} If credentials are invalid format
 * @throws {AuthenticationError} If credentials are incorrect
 * @throws {Error} If server configuration is invalid
 */
export async function login(
  credentials: LoginCredentials
): Promise<LoginResult> {

  if (!credentials) {
    throw new ValidationError("Credentials are required");
  }
  
  const { email, username, password } = credentials;

  // Validate input format
  if (!password) {
    throw new ValidationError('Password is required');
  }

  const identifier = email || username;
  if (!identifier) {
    throw new ValidationError('Email or username is required');
  }

  // Find user
  const user = await findUserByEmailOrUsername(identifier);
  if (!user) {
    throw new AuthenticationError('Invalid credentials');
  }

  // Validate password
  const isPasswordValid = validatePassword(password, user.password);
  if (!isPasswordValid) {
    throw new AuthenticationError('Invalid credentials');
  }

  // Create JWT payload
  const payload: TokenPayload = {
    userId: user.userId,
    username: user.username,
    email: user.email,
    role: user.role,
  };

  // Generate tokens using token service
  // Access token uses ACCESS_TOKEN_SECRET, refresh token uses REFRESH_TOKEN_SECRET
  const accessToken = generateToken(payload, { expiresIn: '30m' });
  const refreshToken = generateToken(payload, { expiresIn: '7d', useRefreshSecret: true });

  // Return user data (without password) and token
  const userResponse = getUserWithoutPassword(user);

  return {
    user: userResponse,
    accessToken,
    refreshToken,
  };
}

export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
}

/**
 * Refreshes an access token using a refresh token
 * Uses token rotation strategy: generates a new refresh token to invalidate the old one
 * This prevents token reuse if a refresh token is stolen
 * 
 * @param refreshToken - The refresh token to validate
 * @returns New access token and refresh token (token rotation)
 * @throws {AuthenticationError} If refresh token is invalid or expired
 */
export async function refresh(refreshToken: string): Promise<RefreshResult> {
  if (!refreshToken) {
    throw new ValidationError('Refresh token is required');
  }

  // Check if refresh token is blacklisted
  if (isTokenBlacklisted(refreshToken)) {
    throw new AuthenticationError('Refresh token has been revoked');
  }

  try {
    // Verify the refresh token using REFRESH_TOKEN_SECRET
    const refreshSecret = process.env.REFRESH_TOKEN_SECRET;
    if (!refreshSecret) {
      throw new Error('Server configuration error: REFRESH_TOKEN_SECRET is not set');
    }
    const payload = verifyToken(refreshToken, refreshSecret);

    // Generate new tokens (token rotation: new refresh token invalidates the old one)
    const tokenPayload: TokenPayload = {
      userId: payload.userId,
      username: payload.username,
      email: payload.email,
      role: payload.role,
    };

    // Generate new access token (short-lived)
    const newAccessToken = generateToken(tokenPayload, { expiresIn: '30m' });
    
    // Generate new refresh token (token rotation for security)
    // The old refresh token is now invalid, preventing reuse if it was stolen
    const newRefreshToken = generateToken(tokenPayload, { expiresIn: '7d', useRefreshSecret: true });

    // Blacklist the old refresh token
    const decodedOldToken = decodeToken(refreshToken);
    if (decodedOldToken && decodedOldToken.exp) {
      blacklistToken(refreshToken, decodedOldToken.exp, payload.userId);
    }

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  } catch (error) {
    throw new AuthenticationError('Invalid or expired refresh token');
  }
}

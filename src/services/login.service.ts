import {
  findUserByEmailOrUsername,
  validatePassword,
  getUserWithoutPassword,
} from './user.service';
import { generateToken, TokenPayload } from './token.service';

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
  token: string;
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

  // Generate token using token service
  const token = generateToken(payload);

  // Return user data (without password) and token
  const userResponse = getUserWithoutPassword(user);

  return {
    user: userResponse,
    token,
  };
}

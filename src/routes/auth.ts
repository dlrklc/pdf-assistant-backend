import express from 'express';
import {
  login,
  refresh,
  LoginCredentials,
  AuthenticationError,
  ValidationError,
} from '../services/login.service';
import { blacklistToken } from '../services/token-blacklist.service';
import { decodeToken } from '../services/token.service';

const router = express.Router();

/**
 * POST /api/auth/login
 * Login endpoint - accepts email/username and password, returns JWT tokens
 * 
 * Request body:
 * {
 *   "email"?: string,
 *   "username"?: string,
 *   "password": string
 * }
 */
router.post('/login', async (req, res) => {
  try {
    const credentials: LoginCredentials = req.body;

    // Delegate business logic to service layer
    const result = await login(credentials);

    return void res.status(200)
      .cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 604800000, // 7 days
      })
      .header('Authorization', `Bearer ${result.accessToken}`)
      .json({ 
        message: 'Login successful', 
        user: result.user,
        accessToken: result.accessToken 
      });
  } catch (error) {
    // Handle specific error types
    if (error instanceof ValidationError) {
      return void res.status(400).json({
        error: error.message,
      });
    }

    if (error instanceof AuthenticationError) {
      return void res.status(401).json({
        error: error.message,
      });
    }

    // Handle unexpected errors
    console.error('Login error:', error);
    return void res.status(500).json({
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh token endpoint - accepts refresh token, returns new access and refresh tokens
 */
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return void res.status(401).json({ error: 'Access Denied. No refresh token provided.' });
    }

    const result = await refresh(refreshToken);

    return void res.status(200)
      .cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 604800000, // 7 days
      })
      .header('Authorization', `Bearer ${result.accessToken}`)
      .json({ 
        message: 'Token refreshed successfully',
        accessToken: result.accessToken 
      });
  } catch (error) {
    // Handle specific error types
    if (error instanceof ValidationError) {
      return void res.status(400).json({
        error: error.message,
      });
    }

    if (error instanceof AuthenticationError) {
      return void res.status(401).json({
        error: error.message,
      });
    }

    // Handle unexpected errors
    console.error('Refresh token error:', error);
    return void res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/logout
 * Logout endpoint - blacklists tokens and clears refresh token cookie
 * 
 * Request headers:
 * - Authorization: Bearer <accessToken> - optional but recommended
 * 
 * Request cookies:
 * - refreshToken: The refresh token to blacklist
 */
router.post('/logout', async (req, res) => {
  try {
    // Get access token from Authorization header if provided
    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    // Get refresh token from cookie
    const refreshToken = req.cookies?.refreshToken;

    // Blacklist access token if provided
    if (accessToken) {
      const decoded = decodeToken(accessToken);
      if (decoded && decoded.exp) {
        blacklistToken(accessToken, decoded.exp);
      }
    }

    // Blacklist refresh token if provided
    if (refreshToken) {
      const decoded = decodeToken(refreshToken);
      if (decoded && decoded.exp) {
        blacklistToken(refreshToken, decoded.exp);
      }
    }

    // Clear the refresh token cookie
    return void res.status(200)
      .clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      })
      .json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    return void res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


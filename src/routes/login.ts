import express from 'express';
import {
  login,
  refresh,
  LoginCredentials,
  AuthenticationError,
  ValidationError,
} from '../services/login.service';

const router = express.Router();

/**
 * POST /api/login
 * Login endpoint - accepts email/username and password, returns JWT token
 * 
 * Request body:
 * {
 *   "email"?: string,
 *   "username"?: string,
 *   "password": string
 * }
 */
router.post('/', async (req, res) => {
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
      maxAge: 604800000,
    })
    .header('Authorization', `Bearer ${result.accessToken}`)
    .json({ message: 'Login successful', user: result.user });
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
 * POST /api/login/refresh
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
      .json({ message: 'Token refreshed successfully' });
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

export default router;
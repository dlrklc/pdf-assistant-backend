import express from 'express';
import {
  login,
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

    return void res.status(200).json({
      message: 'Login successful',
      user: result.user,
      token: result.token,
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

export default router;
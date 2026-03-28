/**
 * dime_base - Auth API Routes
 *
 * Owner registration and login endpoints
 */

import { Router, Request, Response } from 'express';
import * as auth from '../agents/auth';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new owner
 */
router.post('/register', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    const result = auth.register(email, password);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    // Return without password hash
    const { passwordHash, ...safeOwner } = result.owner!;

    res.status(201).json({
      success: true,
      owner: safeOwner,
      token: result.token
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    const result = auth.login(email, password);

    if (!result.success) {
      return res.status(401).json({
        success: false,
        error: result.error
      });
    }

    // Return without password hash
    const { passwordHash, ...safeOwner } = result.owner!;

    res.json({
      success: true,
      owner: safeOwner,
      token: result.token
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/auth/me
 * Get current user info (requires auth)
 */
router.get('/me', (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const decoded = auth.authenticateRequest(authHeader);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }

    const owner = auth.getOwner(decoded.ownerId);

    if (!owner) {
      return res.status(404).json({
        success: false,
        error: 'Owner not found'
      });
    }

    // Return without password hash
    const { passwordHash, ...safeOwner } = owner;

    res.json({
      success: true,
      owner: safeOwner
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/auth/logout
 * Logout (client-side token removal)
 */
router.post('/logout', (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      auth.revokeToken(token);
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

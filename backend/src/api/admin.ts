/**
 * dime_base - Admin API Routes
 *
 * System administration endpoints with authentication and audit logging
 */

import { Router, Request, Response } from 'express';
import * as admin from '../agents/admin';
import { authenticateRequest, isSuperAdmin } from '../agents/auth';

const router = Router();

// ============== MIDDLEWARE ==============

/**
 * Admin authentication middleware
 * Verifies JWT token and checks if user is an admin (any role)
 */
function adminAuth(req: Request, res: Response, next: Function) {
  const authHeader = req.headers.authorization;
  const decoded = authenticateRequest(authHeader);

  if (!decoded) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated'
    });
  }

  // Check if user is an admin (any role)
  if (!admin.isAdmin(decoded.ownerId)) {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }

  const adminInfo = admin.getAdminByOwnerId(decoded.ownerId);
  req.body.adminId = adminInfo!.id;
  req.body.adminOwnerId = decoded.ownerId;
  req.body.adminEmail = decoded.email;
  req.body.adminRole = adminInfo!.role;
  next();
}

/**
 * Super admin only middleware (must be used after adminAuth)
 */
function superAdminOnly(req: Request, res: Response, next: Function) {
  if (req.body.adminRole !== 'super_admin') {
    return res.status(403).json({
      success: false,
      error: 'Super admin access required'
    });
  }
  next();
}

/**
 * Log admin action middleware
 */
function logAction(action: string, target: string) {
  return (req: Request, res: Response, next: Function) => {
    res.on('finish', () => {
      if (res.statusCode < 400 && req.body.adminId) {
        admin.logAdminAction(
          req.body.adminId,
          action,
          target,
          {
            method: req.method,
            path: req.path,
            body: req.body
          }
        );
      }
    });
    next();
  };
}

// ============== SYSTEM STATS ==============

/**
 * GET /api/admin/stats
 * Get system statistics
 */
router.get('/stats', adminAuth, (req: Request, res: Response) => {
  try {
    const stats = admin.getStats();

    res.json({
      success: true,
      stats
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============== PLAYGROUND MANAGEMENT ==============

/**
 * GET /api/admin/playgrounds
 * Get all playgrounds with usage info
 */
router.get('/playgrounds', adminAuth, (req: Request, res: Response) => {
  try {
    const playgrounds = admin.getPlaygrounds();

    res.json({
      success: true,
      playgrounds
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/admin/playgrounds
 * Create a new playground
 */
router.post('/playgrounds', adminAuth, logAction('create_playground', 'playground'), (req: Request, res: Response) => {
  try {
    const { name, type, description, maxAgents } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Name is required'
      });
    }

    if (!type || !['social', 'game', 'work', 'creative'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid type. Must be: social, game, work, or creative'
      });
    }

    if (maxAgents && (maxAgents < 1 || maxAgents > 1000)) {
      return res.status(400).json({
        success: false,
        error: 'maxAgents must be between 1 and 1000'
      });
    }

    const playground = admin.createPlayground(name, type, description, maxAgents || 50);

    res.status(201).json({
      success: true,
      playground
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/admin/playgrounds/:id
 * Update playground settings
 */
router.put('/playgrounds/:id', adminAuth, logAction('update_playground', 'playground'), (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, type, maxAgents } = req.body;

    // Validate type if provided
    if (type && !['social', 'game', 'work', 'creative'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid type. Must be: social, game, work, or creative'
      });
    }

    // Validate maxAgents if provided
    if (maxAgents !== undefined && (maxAgents < 1 || maxAgents > 1000)) {
      return res.status(400).json({
        success: false,
        error: 'maxAgents must be between 1 and 1000'
      });
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (type !== undefined) updates.type = type;
    if (maxAgents !== undefined) updates.maxAgents = maxAgents;

    const playground = admin.updatePlayground(id, updates);

    if (!playground) {
      return res.status(404).json({
        success: false,
        error: 'Playground not found'
      });
    }

    res.json({
      success: true,
      playground
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/admin/playgrounds/:id
 * Delete a playground
 */
router.delete('/playgrounds/:id', adminAuth, logAction('delete_playground', 'playground'), (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const success = admin.deletePlayground(id);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Playground not found'
      });
    }

    res.json({
      success: true,
      message: 'Playground deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============== OWNER MANAGEMENT ==============

/**
 * GET /api/admin/owners
 * List all owners
 */
router.get('/owners', adminAuth, (req: Request, res: Response) => {
  try {
    const owners = admin.listOwners();

    res.json({
      success: true,
      owners
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/admin/owners/:id/suspend
 * Suspend an owner account
 */
router.post('/owners/:id/suspend', adminAuth, logAction('suspend_owner', 'owner'), (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const success = admin.suspendOwner(id);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Owner not found'
      });
    }

    res.json({
      success: true,
      message: 'Owner suspended successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/admin/owners/:id/activate
 * Activate a suspended owner account
 */
router.post('/owners/:id/activate', adminAuth, logAction('activate_owner', 'owner'), (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const success = admin.activateOwner(id);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Owner not found'
      });
    }

    res.json({
      success: true,
      message: 'Owner activated successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/admin/owners/:id/reset-password
 * Reset owner password
 */
router.post('/owners/:id/reset-password', adminAuth, logAction('reset_password', 'owner'), (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        error: 'newPassword is required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters'
      });
    }

    const success = admin.resetOwnerPassword(id, newPassword);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Owner not found'
      });
    }

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============== AUDIT LOG ==============

/**
 * GET /api/admin/audit
 * Get audit logs
 */
router.get('/audit', adminAuth, (req: Request, res: Response) => {
  try {
    const {
      adminId,
      action,
      target,
      limit
    } = req.query;

    const options: any = {};
    if (adminId) options.adminId = adminId as string;
    if (action) options.action = action as string;
    if (target) options.target = target as string;
    if (limit) options.limit = parseInt(limit as string);

    const logs = admin.getAuditLogs(options);

    res.json({
      success: true,
      logs
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============== ADMIN MANAGEMENT (Super Admin Only) ==============

/**
 * GET /api/admin/admins
 * List all admins (super_admin only)
 */
router.get('/admins', adminAuth, superAdminOnly, (req: Request, res: Response) => {
  try {
    const adminsList = admin.getAllAdminsWithOwnerInfo();

    res.json({
      success: true,
      admins: adminsList
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/admin/admins
 * Create a new admin (super_admin only)
 */
router.post('/admins', adminAuth, superAdminOnly, (req: Request, res: Response) => {
  try {
    const { ownerId, role } = req.body;

    if (!ownerId || !role) {
      return res.status(400).json({
        success: false,
        error: 'ownerId and role are required'
      });
    }

    if (!['super_admin', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Must be super_admin or admin'
      });
    }

    const result = admin.createAdmin(ownerId, role, req.body.adminId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.status(201).json({
      success: true,
      admin: result.admin,
      message: 'Admin created successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/admin/admins/:id
 * Delete an admin (super_admin only)
 */
router.delete('/admins/:id', adminAuth, superAdminOnly, (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = admin.deleteAdmin(id, req.body.adminId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      message: 'Admin deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/admin/check
 * Check admin status for current user
 */
router.get('/check', adminAuth, (req: Request, res: Response) => {
  try {
    const adminInfo = admin.getAdminByOwnerId(req.body.adminOwnerId);

    res.json({
      success: true,
      isAdmin: true,
      isSuperAdmin: req.body.adminRole === 'super_admin',
      admin: adminInfo
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;

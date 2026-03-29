/**
 * dime_base - Admin Module
 *
 * System administration, audit logging, and management operations
 */

import { v4 as uuidv4 } from 'uuid';
import { getDb, saveDatabase } from '../database';

// ============== TYPES ==============

export interface AdminAction {
  id: string;
  adminId: string;
  action: string;
  target: string;
  timestamp: string;
  details: any;
}

export interface SystemStats {
  activeUsers: number;
  totalDimes: number;
  activeDimes: number;
  totalPlaygrounds: number;
  avgActivity: number;
  errorRate: number;
  totalTransactions: number;
}

export interface PlaygroundInfo {
  id: string;
  name: string;
  description: string;
  type: string;
  maxAgents: number;
  createdAt: string;
  currentAgents?: number;
}

export interface OwnerInfo {
  id: string;
  email: string;
  createdAt: string;
  lastLogin?: string;
  status: 'active' | 'suspended';
}

// ============== AUDIT LOGGING ==============

const auditLog: AdminAction[] = [];

/**
 * Log an admin action to the audit trail
 */
export function logAdminAction(
  adminId: string,
  action: string,
  target: string,
  details: any
): AdminAction {
  const adminAction: AdminAction = {
    id: uuidv4(),
    adminId,
    action,
    target,
    timestamp: new Date().toISOString(),
    details
  };

  auditLog.push(adminAction);

  // Keep only last 1000 audit entries
  if (auditLog.length > 1000) {
    auditLog.shift();
  }

  return adminAction;
}

/**
 * Get audit log with optional filtering
 */
export function getAuditLogs(options?: {
  adminId?: string;
  action?: string;
  target?: string;
  limit?: number;
}): AdminAction[] {
  let logs = [...auditLog];

  if (options?.adminId) {
    logs = logs.filter(log => log.adminId === options.adminId);
  }

  if (options?.action) {
    logs = logs.filter(log => log.action === options.action);
  }

  if (options?.target) {
    logs = logs.filter(log => log.target === options.target);
  }

  // Sort by timestamp descending
  logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (options?.limit) {
    logs = logs.slice(0, options.limit);
  }

  return logs;
}

// ============== SYSTEM STATS ==============

/**
 * Get system statistics
 */
export function getStats(): SystemStats {
  const db = getDb();

  // Count total dimes
  const dimesResult = db.exec("SELECT status FROM dimes");
  const totalDimes = dimesResult.length > 0 ? dimesResult[0].values.length : 0;
  const activeDimes = dimesResult.length > 0
    ? dimesResult[0].values.filter((row: any[]) => row[0] === 'active').length
    : 0;

  // Count active users (owners with active dimes)
  const activeOwnersResult = db.exec(`
    SELECT DISTINCT owner_id
    FROM dimes
    WHERE status = 'active'
  `);
  const activeUsers = activeOwnersResult.length > 0 ? activeOwnersResult[0].values.length : 0;

  // Count total owners
  const ownersResult = db.exec("SELECT id FROM owners");
  const totalOwners = ownersResult.length > 0 ? ownersResult[0].values.length : 0;

  // Count playgrounds
  const playgroundsResult = db.exec("SELECT id FROM playgrounds");
  const totalPlaygrounds = playgroundsResult.length > 0 ? playgroundsResult[0].values.length : 0;

  // Count transactions
  const transactionsResult = db.exec("SELECT id FROM transactions");
  const totalTransactions = transactionsResult.length > 0 ? transactionsResult[0].values.length : 0;

  // Calculate average activity (active dimes / total dimes)
  const avgActivity = totalDimes > 0 ? (activeDimes / totalDimes) * 100 : 0;

  // Error rate is simplified for MVP (would need real error tracking)
  const errorRate = 0; // No error tracking in MVP

  return {
    activeUsers,
    totalDimes,
    activeDimes,
    totalPlaygrounds,
    avgActivity: Math.round(avgActivity * 100) / 100,
    errorRate,
    totalTransactions
  };
}

// ============== PLAYGROUND MANAGEMENT ==============

/**
 * Create a new playground
 */
export function createPlayground(
  name: string,
  type: string = 'social',
  description: string = '',
  maxAgents: number = 50
): PlaygroundInfo {
  const db = getDb();
  const id = uuidv4();
  const now = new Date().toISOString();

  db.run(
    `INSERT INTO playgrounds (id, name, description, type, max_agents, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, name, description, type, maxAgents, now]
  );

  saveDatabase();

  const playground: PlaygroundInfo = {
    id,
    name,
    description,
    type,
    maxAgents,
    createdAt: now
  };

  return playground;
}

/**
 * Delete a playground
 */
export function deletePlayground(playgroundId: string): boolean {
  const db = getDb();

  // Check if playground exists
  const existing = db.exec("SELECT id FROM playgrounds WHERE id = ?", [playgroundId]);
  if (existing.length === 0 || existing[0].values.length === 0) {
    return false;
  }

  // Remove agents from this playground
  db.run("DELETE FROM agent_locations WHERE playground_id = ?", [playgroundId]);

  // Delete playground
  db.run("DELETE FROM playgrounds WHERE id = ?", [playgroundId]);

  saveDatabase();

  return true;
}

/**
 * Get all playgrounds with current agent count
 */
export function getPlaygrounds(): PlaygroundInfo[] {
  const db = getDb();
  const result = db.exec("SELECT * FROM playgrounds");

  if (result.length === 0) {
    return [];
  }

  const cols = result[0].columns;
  const playgrounds: PlaygroundInfo[] = result[0].values.map((vals: any[]) => {
    const row: any = {};
    cols.forEach((col: string, i: number) => { row[col] = vals[i]; });

    // Count current agents in this playground
    const locationResult = db.exec(
      "SELECT COUNT(*) FROM agent_locations WHERE playground_id = ?",
      [row.id]
    );
    const currentAgents = locationResult.length > 0 && locationResult[0].values.length > 0
      ? locationResult[0].values[0][0]
      : 0;

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      type: row.type,
      maxAgents: row.max_agents,
      createdAt: row.created_at,
      currentAgents
    };
  });

  return playgrounds;
}

/**
 * Update playground settings
 */
export function updatePlayground(
  playgroundId: string,
  updates: {
    name?: string;
    description?: string;
    type?: string;
    maxAgents?: number;
  }
): PlaygroundInfo | null {
  const db = getDb();

  // Check if playground exists
  const existing = db.exec("SELECT * FROM playgrounds WHERE id = ?", [playgroundId]);
  if (existing.length === 0 || existing[0].values.length === 0) {
    return null;
  }

  const cols = existing[0].columns;
  const vals = existing[0].values[0];
  const row: any = {};
  cols.forEach((col: string, i: number) => { row[col] = vals[i]; });

  // Build update query
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }

  if (updates.description !== undefined) {
    fields.push('description = ?');
    values.push(updates.description);
  }

  if (updates.type !== undefined) {
    fields.push('type = ?');
    values.push(updates.type);
  }

  if (updates.maxAgents !== undefined) {
    fields.push('max_agents = ?');
    values.push(updates.maxAgents);
  }

  if (fields.length > 0) {
    values.push(playgroundId);
    db.run(
      `UPDATE playgrounds SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    saveDatabase();
  }

  // Get updated playground with current agent count
  const updated = db.exec("SELECT * FROM playgrounds WHERE id = ?", [playgroundId]);
  if (updated.length === 0 || updated[0].values.length === 0) {
    return null;
  }

  const updatedCols = updated[0].columns;
  const updatedVals = updated[0].values[0];
  const updatedRow: any = {};
  updatedCols.forEach((col: string, i: number) => { updatedRow[col] = updatedVals[i]; });

  const locationResult = db.exec(
    "SELECT COUNT(*) FROM agent_locations WHERE playground_id = ?",
    [playgroundId]
  );
  const currentAgents = locationResult.length > 0 && locationResult[0].values.length > 0
    ? locationResult[0].values[0][0]
    : 0;

  return {
    id: updatedRow.id,
    name: updatedRow.name,
    description: updatedRow.description,
    type: updatedRow.type,
    maxAgents: updatedRow.max_agents,
    createdAt: updatedRow.created_at,
    currentAgents
  };
}

// ============== OWNER MANAGEMENT ==============

/**
 * Get all owners
 */
export function listOwners(): OwnerInfo[] {
  const db = getDb();

  // Ensure auth tables exist
  try {
    db.exec("SELECT id FROM owners WHERE id = 'init_check'");
  } catch (e) {
    // Table doesn't exist yet
    return [];
  }

  const result = db.exec("SELECT id, email, created_at, last_login FROM owners");

  if (result.length === 0) {
    return [];
  }

  const cols = result[0].columns;
  return result[0].values.map((vals: any[]) => {
    const row: any = {};
    cols.forEach((col: string, i: number) => { row[col] = vals[i]; });

    return {
      id: row.id,
      email: row.email,
      createdAt: row.created_at,
      lastLogin: row.last_login,
      status: 'active' // MVP: no suspended state yet
    };
  });
}

/**
 * Suspend an owner account
 */
export function suspendOwner(ownerId: string): boolean {
  const db = getDb();

  // Check if owner exists
  const existing = db.exec("SELECT id FROM owners WHERE id = ?", [ownerId]);
  if (existing.length === 0 || existing[0].values.length === 0) {
    return false;
  }

  // Pause all dimes owned by this owner
  db.run("UPDATE dimes SET status = 'paused' WHERE owner_id = ?", [ownerId]);

  saveDatabase();

  return true;
}

/**
 * Activate a suspended owner account
 */
export function activateOwner(ownerId: string): boolean {
  const db = getDb();

  // Check if owner exists
  const existing = db.exec("SELECT id FROM owners WHERE id = ?", [ownerId]);
  if (existing.length === 0 || existing[0].values.length === 0) {
    return false;
  }

  // Activate all dimes owned by this owner
  db.run("UPDATE dimes SET status = 'active' WHERE owner_id = ?", [ownerId]);

  saveDatabase();

  return true;
}

/**
 * Reset owner password
 */
export function resetOwnerPassword(ownerId: string, newPassword: string): boolean {
  const db = getDb();

  // Check if owner exists
  const existing = db.exec("SELECT id FROM owners WHERE id = ?", [ownerId]);
  if (existing.length === 0 || existing[0].values.length === 0) {
    return false;
  }

  // Validate password
  if (newPassword.length < 6) {
    return false;
  }

  // Hash new password
  const crypto = require('crypto');
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(newPassword, salt, 10000, 64, 'sha512').toString('hex');

  // Update password
  db.run(
    "UPDATE owners SET password_hash = ?, password_salt = ? WHERE id = ?",
    [hash, salt, ownerId]
  );

  saveDatabase();

  return true;
}

// ============== ADMIN MANAGEMENT (references auth functions) ==============

import {
  getAdminByOwnerId as authGetAdminByOwnerId,
  getAdminById as authGetAdminById,
  getAllAdmins as authGetAllAdmins,
  createAdmin as authCreateAdmin,
  deleteAdmin as authDeleteAdmin,
  isAdmin as authIsAdmin,
  isSuperAdmin as authIsSuperAdmin
} from './auth';

// Re-export admin management functions from auth module
export {
  authGetAdminByOwnerId as getAdminByOwnerId,
  authGetAdminById as getAdminById,
  authGetAllAdmins as getAllAdmins,
  authCreateAdmin as createAdmin,
  authDeleteAdmin as deleteAdmin,
  authIsAdmin as isAdmin,
  authIsSuperAdmin as isSuperAdmin
};

/**
 * Get all admins with owner email info (for admin management UI)
 */
export function getAllAdminsWithOwnerInfo(): any[] {
  const db = getDb();

  // Ensure auth tables exist
  try {
    db.exec("SELECT id FROM owners WHERE id = 'init_check'");
  } catch (e) {
    return [];
  }

  const result = db.exec(`
    SELECT a.id, a.owner_id, a.role, a.created_at, a.created_by, o.email
    FROM admins a
    JOIN owners o ON a.owner_id = o.id
  `);

  if (result.length === 0) {
    return [];
  }

  return result[0].values.map((row: any[]) => ({
    id: row[0],
    ownerId: row[1],
    role: row[2],
    createdAt: row[3],
    createdBy: row[4],
    email: row[5]
  }));
}

export default {
  logAdminAction,
  getAuditLogs,
  getStats,
  createPlayground,
  deletePlayground,
  getPlaygrounds,
  updatePlayground,
  listOwners,
  suspendOwner,
  activateOwner,
  resetOwnerPassword,
  getAllAdminsWithOwnerInfo,
  getAdminByOwnerId: authGetAdminByOwnerId,
  getAdminById: authGetAdminById,
  getAllAdmins: authGetAllAdmins,
  createAdmin: authCreateAdmin,
  deleteAdmin: authDeleteAdmin,
  isAdmin: authIsAdmin,
  isSuperAdmin: authIsSuperAdmin
};

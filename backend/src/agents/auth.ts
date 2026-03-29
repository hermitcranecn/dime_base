/**
 * dime_base - Authentication Module
 *
 * Owner registration, login, and JWT token management
 */

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { getDb, saveDatabase } from '../database';

const JWT_SECRET = process.env.JWT_SECRET || 'dime_base_dev_secret_change_in_production';
const JWT_EXPIRES_IN = '7d';

export interface Owner {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  lastLogin?: string;
}

export interface AuthToken {
  ownerId: string;
  email: string;
  iat: number;
  exp: number;
}

// In-memory token store for fast lookup
const tokenStore = new Map<string, string>(); // token -> ownerId

// ============== PASSWORD HASHING ==============

function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const useSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, useSalt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt: useSalt };
}

function verifyPassword(password: string, hash: string, salt: string): boolean {
  const { hash: computedHash } = hashPassword(password, salt);
  return computedHash === hash;
}

// ============== JWT ==============

export function generateToken(ownerId: string, email: string): string {
  const token = jwt.sign({ ownerId, email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  tokenStore.set(token, ownerId);
  return token;
}

export function verifyToken(token: string): AuthToken | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthToken;
    if (tokenStore.has(token)) {
      return decoded;
    }
    return null;
  } catch {
    return null;
  }
}

export function revokeToken(token: string): void {
  tokenStore.delete(token);
}

// ============== DATABASE ==============

function createAuthTables(): void {
  const db = getDb();

  db.run(`
    CREATE TABLE IF NOT EXISTS owners (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      created_at TEXT NOT NULL,
      last_login TEXT
    )
  `);

  saveDatabase();
}

function ensureAuthTables(): void {
  const db = getDb();
  if (db) {
    try {
      db.exec("SELECT id FROM owners WHERE id = 'init_check'");
    } catch (e) {
      createAuthTables();
    }
  }
}

// ============== AUTH OPERATIONS ==============

/**
 * Register a new owner
 */
export function register(email: string, password: string): { success: boolean; owner?: Owner; token?: string; error?: string } {
  ensureAuthTables();
  const db = getDb();

  // Check if email exists
  const existing = db.exec(
    "SELECT id FROM owners WHERE email = ?",
    [email]
  );

  if (existing.length > 0 && existing[0].values.length > 0) {
    return { success: false, error: 'Email already registered' };
  }

  // Validate password
  if (password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters' };
  }

  // Create owner
  const id = crypto.randomUUID();
  const { hash, salt } = hashPassword(password);
  const createdAt = new Date().toISOString();

  db.run(
    `INSERT INTO owners (id, email, password_hash, password_salt, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [id, email, hash, salt, createdAt]
  );

  saveDatabase();

  const owner: Owner = { id, email, passwordHash: hash, createdAt };
  const token = generateToken(id, email);

  return { success: true, owner, token };
}

/**
 * Login with email and password
 */
export function login(email: string, password: string): { success: boolean; owner?: Owner; token?: string; error?: string } {
  ensureAuthTables();
  const db = getDb();

  // Find owner
  const result = db.exec(
    "SELECT id, email, password_hash, password_salt, created_at FROM owners WHERE email = ?",
    [email]
  );

  if (result.length === 0 || result[0].values.length === 0) {
    return { success: false, error: 'Invalid email or password' };
  }

  const row = result[0].values[0];
  const owner: Owner = {
    id: row[0] as string,
    email: row[1] as string,
    passwordHash: row[2] as string,
    createdAt: row[4] as string
  };

  const salt = row[3] as string;

  // Verify password
  if (!verifyPassword(password, owner.passwordHash, salt)) {
    return { success: false, error: 'Invalid email or password' };
  }

  // Update last login
  const lastLogin = new Date().toISOString();
  db.run("UPDATE owners SET last_login = ? WHERE id = ?", [lastLogin, owner.id]);
  saveDatabase();

  owner.lastLogin = lastLogin;
  const token = generateToken(owner.id, owner.email);

  return { success: true, owner, token };
}

/**
 * Get owner by ID
 */
export function getOwner(ownerId: string): Owner | null {
  ensureAuthTables();
  const db = getDb();

  const result = db.exec(
    "SELECT id, email, password_hash, created_at, last_login FROM owners WHERE id = ?",
    [ownerId]
  );

  if (result.length === 0 || result[0].values.length === 0) {
    return null;
  }

  const row = result[0].values[0];
  return {
    id: row[0] as string,
    email: row[1] as string,
    passwordHash: row[2] as string,
    createdAt: row[3] as string,
    lastLogin: row[4] as string | undefined
  };
}

/**
 * Authenticate request by token
 */
export function authenticateRequest(authHeader: string | undefined): { ownerId: string; email: string } | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7);
  const decoded = verifyToken(token);

  if (!decoded) {
    return null;
  }

  return { ownerId: decoded.ownerId, email: decoded.email };
}

// ============== ADMIN MANAGEMENT ==============

export interface Admin {
  id: string;
  ownerId: string;
  role: 'super_admin' | 'admin';
  tokenHash?: string;
  createdAt: string;
  createdBy?: string;
}

function ensureAdminTables(): void {
  const db = getDb();
  try {
    db.exec("SELECT id FROM admins WHERE id = 'init_check'");
  } catch (e) {
    // Table doesn't exist yet, create it
    db.run(`
      CREATE TABLE IF NOT EXISTS admins (
        id TEXT PRIMARY KEY,
        owner_id TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('super_admin', 'admin')),
        token_hash TEXT,
        created_at TEXT NOT NULL,
        created_by TEXT,
        FOREIGN KEY (owner_id) REFERENCES owners(id),
        FOREIGN KEY (created_by) REFERENCES admins(id)
      )
    `);
    saveDatabase();
  }
}

/**
 * Check if any admins exist (for first-time setup)
 */
export function hasAdmins(): boolean {
  ensureAdminTables();
  const db = getDb();
  const result = db.exec("SELECT id FROM admins LIMIT 1");
  return result.length > 0 && result[0].values.length > 0;
}

/**
 * Get admin by owner ID
 */
export function getAdminByOwnerId(ownerId: string): Admin | null {
  ensureAdminTables();
  const db = getDb();
  const result = db.exec(
    "SELECT id, owner_id, role, token_hash, created_at, created_by FROM admins WHERE owner_id = ?",
    [ownerId]
  );

  if (result.length === 0 || result[0].values.length === 0) {
    return null;
  }

  const row = result[0].values[0];
  return {
    id: row[0] as string,
    ownerId: row[1] as string,
    role: row[2] as 'super_admin' | 'admin',
    tokenHash: row[3] as string | undefined,
    createdAt: row[4] as string,
    createdBy: row[5] as string | undefined
  };
}

/**
 * Get admin by admin ID
 */
export function getAdminById(adminId: string): Admin | null {
  ensureAdminTables();
  const db = getDb();
  const result = db.exec(
    "SELECT id, owner_id, role, token_hash, created_at, created_by FROM admins WHERE id = ?",
    [adminId]
  );

  if (result.length === 0 || result[0].values.length === 0) {
    return null;
  }

  const row = result[0].values[0];
  return {
    id: row[0] as string,
    ownerId: row[1] as string,
    role: row[2] as 'super_admin' | 'admin',
    tokenHash: row[3] as string | undefined,
    createdAt: row[4] as string,
    createdBy: row[5] as string | undefined
  };
}

/**
 * Get all admins
 */
export function getAllAdmins(): Admin[] {
  ensureAdminTables();
  const db = getDb();
  const result = db.exec("SELECT id, owner_id, role, token_hash, created_at, created_by FROM admins");

  if (result.length === 0) {
    return [];
  }

  return result[0].values.map((row: any[]) => ({
    id: row[0] as string,
    ownerId: row[1] as string,
    role: row[2] as 'super_admin' | 'admin',
    tokenHash: row[3] as string | undefined,
    createdAt: row[4] as string,
    createdBy: row[5] as string | undefined
  }));
}

/**
 * Create the first super_admin (root) - can only be called once
 * Returns the one-time root token (never stored, only shown once)
 */
export function createRootAdmin(ownerId: string, email: string): { success: boolean; rootToken?: string; error?: string } {
  ensureAdminTables();

  // Check if any admins exist
  if (hasAdmins()) {
    return { success: false, error: 'Root admin already exists. Use admin login to manage.' };
  }

  const db = getDb();
  const adminId = crypto.randomUUID();
  const now = new Date().toISOString();

  // Generate one-time root token
  const rootToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rootToken).digest('hex');

  db.run(
    `INSERT INTO admins (id, owner_id, role, token_hash, created_at, created_by)
     VALUES (?, ?, ?, ?, ?, NULL)`,
    [adminId, ownerId, 'super_admin', tokenHash, now]
  );

  saveDatabase();

  // Return the plain root token (it's only shown once)
  return { success: true, rootToken };
}

/**
 * Verify root token (one-time use)
 * Returns admin ID if valid, null if invalid or already used
 */
export function verifyRootToken(token: string): string | null {
  ensureAdminTables();
  const db = getDb();

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const result = db.exec(
    "SELECT id, token_hash FROM admins WHERE role = 'super_admin' AND token_hash IS NOT NULL",
  );

  if (result.length === 0 || result[0].values.length === 0) {
    return null;
  }

  const row = result[0].values[0];
  const storedHash = row[1] as string;

  if (storedHash === tokenHash) {
    // Token is valid - clear it (one-time use)
    const adminId = row[0] as string;
    db.run("UPDATE admins SET token_hash = NULL WHERE id = ?", [adminId]);
    saveDatabase();
    return adminId;
  }

  return null;
}

/**
 * Create a new admin (super_admin only)
 */
export function createAdmin(
  ownerId: string,
  role: 'super_admin' | 'admin',
  createdBy: string
): { success: boolean; admin?: Admin; error?: string } {
  ensureAdminTables();

  // Check if requester is super_admin
  const creator = getAdminById(createdBy);
  if (!creator || creator.role !== 'super_admin') {
    return { success: false, error: 'Only super_admin can create admins' };
  }

  // Check if owner already has an admin role
  const existing = getAdminByOwnerId(ownerId);
  if (existing) {
    return { success: false, error: 'Owner already has an admin role' };
  }

  const db = getDb();
  const adminId = crypto.randomUUID();
  const now = new Date().toISOString();

  db.run(
    `INSERT INTO admins (id, owner_id, role, token_hash, created_at, created_by)
     VALUES (?, ?, ?, NULL, ?, ?)`,
    [adminId, ownerId, role, now, createdBy]
  );

  saveDatabase();

  return {
    success: true,
    admin: {
      id: adminId,
      ownerId,
      role,
      createdAt: now,
      createdBy
    }
  };
}

/**
 * Delete an admin (super_admin only, cannot delete self)
 */
export function deleteAdmin(adminId: string, deletedBy: string): { success: boolean; error?: string } {
  ensureAdminTables();

  // Check if requester is super_admin
  const deleter = getAdminById(deletedBy);
  if (!deleter || deleter.role !== 'super_admin') {
    return { success: false, error: 'Only super_admin can delete admins' };
  }

  // Cannot delete self
  if (adminId === deletedBy) {
    return { success: false, error: 'Cannot delete yourself' };
  }

  // Check if target admin exists
  const target = getAdminById(adminId);
  if (!target) {
    return { success: false, error: 'Admin not found' };
  }

  // Cannot delete the last super_admin
  if (target.role === 'super_admin') {
    const allSuperAdmins = getAllAdmins().filter(a => a.role === 'super_admin');
    if (allSuperAdmins.length <= 1) {
      return { success: false, error: 'Cannot delete the last super_admin' };
    }
  }

  const db = getDb();
  db.run("DELETE FROM admins WHERE id = ?", [adminId]);
  saveDatabase();

  return { success: true };
}

/**
 * Check if requester is admin (any role)
 */
export function isAdmin(ownerId: string): boolean {
  const admin = getAdminByOwnerId(ownerId);
  return admin !== null;
}

/**
 * Check if requester is super_admin
 */
export function isSuperAdmin(ownerId: string): boolean {
  const admin = getAdminByOwnerId(ownerId);
  return admin !== null && admin.role === 'super_admin';
}

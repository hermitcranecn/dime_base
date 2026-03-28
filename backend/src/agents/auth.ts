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

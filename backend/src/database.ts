/**
 * dime_base - SQLite Database Layer
 *
 * Persistent storage using sql.js (pure JS SQLite)
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const initSqlJs = require('sql.js');
import * as fs from 'fs';
import * as path from 'path';

const DB_PATH = path.join(__dirname, '..', 'data', 'dime_base.db');

let db: any;

export async function initDatabase(): Promise<void> {
  // Ensure data directory exists
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const SQL = await initSqlJs();

  // Load existing DB file or create new
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS dimes (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      personality TEXT NOT NULL,
      decision_boundary TEXT NOT NULL,
      memory TEXT NOT NULL,
      config TEXT NOT NULL DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      last_active TEXT NOT NULL
    )
  `);

  // Migration: Add config column if it doesn't exist (for existing databases)
  const columns = db.exec("PRAGMA table_info(dimes)");
  const hasConfigColumn = columns.length > 0 && columns[0].values.some((row: any[]) => row[1] === 'config');
  if (!hasConfigColumn) {
    db.run("ALTER TABLE dimes ADD COLUMN config TEXT NOT NULL DEFAULT '{}'");
    console.log('Migration: Added config column to dimes table');
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS playgrounds (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      type TEXT NOT NULL DEFAULT 'social',
      max_agents INTEGER NOT NULL DEFAULT 50,
      created_at TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS agent_locations (
      dime_id TEXT PRIMARY KEY,
      playground_id TEXT NOT NULL,
      x REAL NOT NULL,
      y REAL NOT NULL,
      last_update TEXT NOT NULL,
      FOREIGN KEY (playground_id) REFERENCES playgrounds(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS accounts (
      user_id TEXT PRIMARY KEY,
      balance REAL NOT NULL DEFAULT 100,
      tier TEXT NOT NULL DEFAULT 'free'
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      timestamp TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES accounts(user_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS d2d_channels (
      id TEXT PRIMARY KEY,
      dime_a TEXT NOT NULL,
      dime_b TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      last_activity TEXT NOT NULL,
      FOREIGN KEY (dime_a) REFERENCES dimes(id),
      FOREIGN KEY (dime_b) REFERENCES dimes(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS d2d_messages (
      id TEXT PRIMARY KEY,
      channel_id TEXT NOT NULL,
      from_dime_id TEXT NOT NULL,
      to_dime_id TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (channel_id) REFERENCES d2d_channels(id),
      FOREIGN KEY (from_dime_id) REFERENCES dimes(id),
      FOREIGN KEY (to_dime_id) REFERENCES dimes(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS digital_goods (
      id TEXT PRIMARY KEY,
      developer_id TEXT NOT NULL,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      price REAL NOT NULL DEFAULT 0,
      pricing_type TEXT NOT NULL DEFAULT 'one-time',
      category TEXT NOT NULL,
      stats TEXT NOT NULL DEFAULT '{"purchases": 0, "rating": 5.0, "uses": 0}',
      published_at TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS dime_scopes (
      dime_id TEXT PRIMARY KEY,
      max_spend_per_transaction REAL NOT NULL DEFAULT 50,
      daily_limit REAL NOT NULL DEFAULT 100,
      monthly_budget REAL NOT NULL DEFAULT 500,
      allowed_categories TEXT NOT NULL DEFAULT '[]',
      allowed_types TEXT NOT NULL DEFAULT '[]',
      can_receive_gifts INTEGER NOT NULL DEFAULT 1,
      can_send_gifts INTEGER NOT NULL DEFAULT 0,
      can_sell_to_others INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (dime_id) REFERENCES dimes(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS dime_goods (
      id TEXT PRIMARY KEY,
      goods_id TEXT NOT NULL,
      dime_id TEXT NOT NULL,
      purchased_by TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'owned',
      config TEXT NOT NULL DEFAULT '{}',
      purchased_at TEXT NOT NULL,
      equipped_at TEXT,
      FOREIGN KEY (goods_id) REFERENCES digital_goods(id),
      FOREIGN KEY (dime_id) REFERENCES dimes(id)
    )
  `);

  // Seed default playground
  const existing = db.exec("SELECT id FROM playgrounds WHERE id = 'main_plaza'");
  if (existing.length === 0) {
    db.run(
      `INSERT INTO playgrounds (id, name, description, type, max_agents, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['main_plaza', 'Main Plaza', 'The central meeting place for all dimes', 'social', 100, new Date().toISOString()]
    );
  }

  saveDatabase();
  console.log('Database initialized at', DB_PATH);
}

export function saveDatabase(): void {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

export function getDb(): any {
  return db;
}

export default { initDatabase, saveDatabase, getDb };

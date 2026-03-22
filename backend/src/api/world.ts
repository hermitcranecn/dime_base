/**
 * dime_base - World API Routes
 * Virtual world / playground management
 * Persisted via SQLite
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb, saveDatabase } from '../database';

const router = Router();

interface Playground {
  id: string;
  name: string;
  description: string;
  type: 'city' | 'office' | 'game' | 'social';
  maxAgents: number;
  createdAt: Date;
}

interface AgentLocation {
  dimeId: string;
  playgroundId: string;
  x: number;
  y: number;
  lastUpdate: Date;
}

// Helper: convert DB row
function rowToPlayground(cols: string[], vals: any[]): Playground {
  const row: any = {};
  cols.forEach((col: string, i: number) => { row[col] = vals[i]; });
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    type: row.type,
    maxAgents: row.max_agents,
    createdAt: new Date(row.created_at)
  };
}

// List all playgrounds
router.get('/', (req: Request, res: Response) => {
  const db = getDb();
  const result = db.exec("SELECT * FROM playgrounds");
  if (result.length === 0) return res.json([]);

  const cols = result[0].columns;
  const playgrounds = result[0].values.map((vals: any[]) => {
    const pg = rowToPlayground(cols, vals);
    // Count agents currently in this playground
    const countResult = db.exec("SELECT COUNT(*) as cnt FROM agent_locations WHERE playground_id = ?", [pg.id]);
    const agentCount = countResult.length > 0 ? countResult[0].values[0][0] as number : 0;
    return { ...pg, agents: agentCount };
  });

  res.json(playgrounds);
});

// Get playground by ID
router.get('/:playgroundId', (req: Request, res: Response) => {
  const { playgroundId } = req.params;
  const db = getDb();
  const result = db.exec("SELECT * FROM playgrounds WHERE id = ?", [playgroundId]);

  if (result.length === 0 || result[0].values.length === 0) {
    return res.status(404).json({ error: 'Playground not found' });
  }

  const pg = rowToPlayground(result[0].columns, result[0].values[0]);
  const agentsResult = db.exec("SELECT dime_id FROM agent_locations WHERE playground_id = ?", [playgroundId]);
  const agents = agentsResult.length > 0 ? agentsResult[0].values.map((v: any[]) => v[0]) : [];

  res.json({ ...pg, agents });
});

// Create playground
router.post('/', (req: Request, res: Response) => {
  const { name, description, type, maxAgents } = req.body;
  const db = getDb();
  const id = uuidv4();
  const now = new Date().toISOString();

  db.run(
    `INSERT INTO playgrounds (id, name, description, type, max_agents, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, name || 'New Playground', description || '', type || 'social', maxAgents || 50, now]
  );
  saveDatabase();

  res.json({
    success: true,
    playground: { id, name: name || 'New Playground', description: description || '', type: type || 'social', maxAgents: maxAgents || 50, createdAt: now }
  });
});

// Get agents in playground
router.get('/:playgroundId/agents', (req: Request, res: Response) => {
  const { playgroundId } = req.params;
  const db = getDb();

  const pgResult = db.exec("SELECT id FROM playgrounds WHERE id = ?", [playgroundId]);
  if (pgResult.length === 0 || pgResult[0].values.length === 0) {
    return res.status(404).json({ error: 'Playground not found' });
  }

  const result = db.exec("SELECT * FROM agent_locations WHERE playground_id = ?", [playgroundId]);
  if (result.length === 0) return res.json([]);

  const cols = result[0].columns;
  const agents = result[0].values.map((vals: any[]) => {
    const row: any = {};
    cols.forEach((col: string, i: number) => { row[col] = vals[i]; });
    return {
      dimeId: row.dime_id,
      x: row.x,
      y: row.y,
      lastUpdate: row.last_update
    };
  });

  res.json(agents);
});

// Agent enters playground
router.post('/:playgroundId/enter', (req: Request, res: Response) => {
  const { playgroundId } = req.params;
  const { dimeId } = req.body;
  const db = getDb();

  const pgResult = db.exec("SELECT * FROM playgrounds WHERE id = ?", [playgroundId]);
  if (pgResult.length === 0 || pgResult[0].values.length === 0) {
    return res.status(404).json({ error: 'Playground not found' });
  }

  const cols = pgResult[0].columns;
  const row: any = {};
  cols.forEach((col: string, i: number) => { row[col] = pgResult[0].values[0][i]; });

  // Check capacity
  const countResult = db.exec("SELECT COUNT(*) FROM agent_locations WHERE playground_id = ?", [playgroundId]);
  const currentCount = countResult.length > 0 ? countResult[0].values[0][0] as number : 0;
  if (currentCount >= row.max_agents) {
    return res.status(400).json({ error: 'Playground is full' });
  }

  const now = new Date().toISOString();
  // Upsert agent location
  const existing = db.exec("SELECT dime_id FROM agent_locations WHERE dime_id = ?", [dimeId]);
  if (existing.length > 0 && existing[0].values.length > 0) {
    db.run("UPDATE agent_locations SET playground_id = ?, x = ?, y = ?, last_update = ? WHERE dime_id = ?",
      [playgroundId, Math.random() * 100, Math.random() * 100, now, dimeId]);
  } else {
    db.run("INSERT INTO agent_locations (dime_id, playground_id, x, y, last_update) VALUES (?, ?, ?, ?, ?)",
      [dimeId, playgroundId, Math.random() * 100, Math.random() * 100, now]);
  }
  saveDatabase();

  res.json({ success: true, playgroundId, dimeId });
});

// Agent exits playground
router.post('/:playgroundId/exit', (req: Request, res: Response) => {
  const { dimeId } = req.body;
  const db = getDb();

  db.run("DELETE FROM agent_locations WHERE dime_id = ?", [dimeId]);
  saveDatabase();

  res.json({ success: true });
});

// Update agent location
router.post('/location', (req: Request, res: Response) => {
  const { dimeId, x, y } = req.body;
  const db = getDb();

  db.run("UPDATE agent_locations SET x = ?, y = ?, last_update = ? WHERE dime_id = ?",
    [x, y, new Date().toISOString(), dimeId]);
  saveDatabase();

  res.json({ success: true });
});

export default router;

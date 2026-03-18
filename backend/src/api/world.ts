/**
 * dime_base - World API Routes
 * Virtual world / playground management
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// In-memory world state
interface Playground {
  id: string;
  name: string;
  description: string;
  type: 'city' | 'office' | 'game' | 'social';
  agents: string[];  // dime IDs
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

const playgrounds = new Map<string, Playground>();
const agentLocations = new Map<string, AgentLocation>();

// Create default playground
const defaultPlayground: Playground = {
  id: 'main_plaza',
  name: 'Main Plaza',
  description: 'The central meeting place for all dimes',
  type: 'social',
  agents: [],
  maxAgents: 100,
  createdAt: new Date()
};
playgrounds.set(defaultPlayground.id, defaultPlayground);

// List all playgrounds
router.get('/', (req: Request, res: Response) => {
  res.json(Array.from(playgrounds.values()));
});

// Get playground by ID
router.get('/:playgroundId', (req: Request, res: Response) => {
  const { playgroundId } = req.params;
  const playground = playgrounds.get(playgroundId);
  
  if (!playground) {
    return res.status(404).json({ error: 'Playground not found' });
  }
  
  res.json(playground);
});

// Create playground
router.post('/', (req: Request, res: Response) => {
  const { name, description, type, maxAgents } = req.body;
  
  const playground: Playground = {
    id: uuidv4(),
    name: name || 'New Playground',
    description: description || '',
    type: type || 'social',
    agents: [],
    maxAgents: maxAgents || 50,
    createdAt: new Date()
  };
  
  playgrounds.set(playground.id, playground);
  res.json({ success: true, playground });
});

// Get agents in playground
router.get('/:playgroundId/agents', (req: Request, res: Response) => {
  const { playgroundId } = req.params;
  const playground = playgrounds.get(playgroundId);
  
  if (!playground) {
    return res.status(404).json({ error: 'Playground not found' });
  }
  
  // Get locations of agents in this playground
  const agents = Array.from(agentLocations.values())
    .filter(loc => loc.playgroundId === playgroundId)
    .map(loc => ({
      dimeId: loc.dimeId,
      x: loc.x,
      y: loc.y,
      lastUpdate: loc.lastUpdate
    }));
  
  res.json(agents);
});

// Agent enters playground
router.post('/:playgroundId/enter', (req: Request, res: Response) => {
  const { playgroundId } = req.params;
  const { dimeId } = req.body;
  
  const playground = playgrounds.get(playgroundId);
  if (!playground) {
    return res.status(404).json({ error: 'Playground not found' });
  }
  
  if (playground.agents.length >= playground.maxAgents) {
    return res.status(400).json({ error: 'Playground is full' });
  }
  
  // Add to playground
  if (!playground.agents.includes(dimeId)) {
    playground.agents.push(dimeId);
  }
  
  // Set location
  agentLocations.set(dimeId, {
    dimeId,
    playgroundId,
    x: Math.random() * 100,
    y: Math.random() * 100,
    lastUpdate: new Date()
  });
  
  res.json({ success: true, playgroundId, dimeId });
});

// Agent exits playground
router.post('/:playgroundId/exit', (req: Request, res: Response) => {
  const { playgroundId } = req.params;
  const { dimeId } = req.body;
  
  const playground = playgrounds.get(playgroundId);
  if (playground) {
    playground.agents = playground.agents.filter(id => id !== dimeId);
  }
  
  agentLocations.delete(dimeId);
  
  res.json({ success: true });
});

// Update agent location
router.post('/location', (req: Request, res: Response) => {
  const { dimeId, x, y } = req.body;
  
  const location = agentLocations.get(dimeId);
  if (location) {
    location.x = x;
    location.y = y;
    location.lastUpdate = new Date();
  }
  
  res.json({ success: true });
});

export default router;

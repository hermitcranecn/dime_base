/**
 * dime_base - Agent Management
 *
 * Handles dime (digital me) agent creation, personality, memory
 * Persisted via SQLite
 */

import { v4 as uuidv4 } from 'uuid';
import { getDb, saveDatabase } from '../database';

// Types
export interface DimePersonality {
  communicationStyle: 'formal' | 'casual' | 'playful';
  detailLevel: 'brief' | 'detailed' | 'balanced';
  decisionStyle: 'analytical' | 'intuitive' | 'balanced';
  riskTolerance: 'high' | 'medium' | 'low';
  socialPreference: 'outgoing' | 'reserved' | 'selective';
  optimism: 'optimist' | 'pessimist' | 'realist';
  interests: string[];
}

export interface Dime {
  id: string;
  ownerId: string;
  name: string;
  personality: DimePersonality;
  decisionBoundary: DecisionBoundary;
  memory: DimeMemory;
  status: 'active' | 'paused' | 'idle';
  createdAt: Date;
  lastActive: Date;
}

export interface DecisionBoundary {
  maxPurchaseAmount: number;
  canJoinGroups: boolean;
  canSharePersonalInfo: boolean;
  escalateAboveAmount: number;
}

export interface DimeMemory {
  shortTerm: ShortTermMemory;
  longTerm: LongTermMemory;
}

export interface ShortTermMemory {
  conversations: Conversation[];
  recentEvents: Event[];
  activeTasks: Task[];
}

export interface LongTermMemory {
  personalityProfile: any;
  learnedPreferences: any;
  relationships: Record<string, Relationship>;
}

export interface Conversation {
  id: string;
  messages: Message[];
  timestamp: Date;
}

export interface Message {
  id: string;
  sender: 'owner' | 'dime' | 'other_dime';
  content: string;
  timestamp: Date;
}

export interface Event {
  id: string;
  type: string;
  description: string;
  timestamp: Date;
}

export interface Task {
  id: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  assignedBy: 'owner' | 'dime' | 'system';
}

export interface Relationship {
  otherDimeId: string;
  interactionCount: number;
  lastInteraction: Date;
  trust: number;
}

// Default personality questionnaire
export const personalityQuestions = [
  {
    key: 'communicationStyle',
    question: 'How do you prefer to communicate?',
    options: ['formal', 'casual', 'playful']
  },
  {
    key: 'detailLevel',
    question: 'How detailed should responses be?',
    options: ['brief', 'detailed', 'balanced']
  },
  {
    key: 'decisionStyle',
    question: 'How do you make decisions?',
    options: ['analytical', 'intuitive', 'balanced']
  },
  {
    key: 'riskTolerance',
    question: 'How do you handle risk?',
    options: ['high', 'medium', 'low']
  },
  {
    key: 'socialPreference',
    question: 'How social are you?',
    options: ['outgoing', 'reserved', 'selective']
  },
  {
    key: 'optimism',
    question: 'What is your outlook?',
    options: ['optimist', 'pessimist', 'realist']
  },
  {
    key: 'interests',
    question: 'What are your interests? (select multiple)',
    options: ['Technology', 'Sports', 'Art', 'Music', 'Reading', 'Travel', 'Food', 'Gaming', 'Science', 'History']
  }
];

// Helper: convert DB row to Dime object
function rowToDime(row: any): Dime {
  const memory = JSON.parse(row.memory);
  // Convert relationships back from plain object
  if (memory.longTerm && memory.longTerm.relationships && !(memory.longTerm.relationships instanceof Map)) {
    // Keep as plain object (Map doesn't serialize to JSON well)
  }
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    personality: JSON.parse(row.personality),
    decisionBoundary: JSON.parse(row.decision_boundary),
    memory,
    status: row.status,
    createdAt: new Date(row.created_at),
    lastActive: new Date(row.last_active)
  };
}

// Create a new dime
export function createDime(ownerId: string, personality?: Partial<DimePersonality>, name?: string): Dime {
  const db = getDb();
  const id = uuidv4();
  const now = new Date().toISOString();

  const dime: Dime = {
    id,
    ownerId,
    name: name || `${ownerId}_dime`,
    personality: {
      communicationStyle: personality?.communicationStyle || 'casual',
      detailLevel: personality?.detailLevel || 'balanced',
      decisionStyle: personality?.decisionStyle || 'analytical',
      riskTolerance: personality?.riskTolerance || 'medium',
      socialPreference: personality?.socialPreference || 'selective',
      optimism: personality?.optimism || 'realist',
      interests: personality?.interests || []
    },
    decisionBoundary: {
      maxPurchaseAmount: 100,
      canJoinGroups: true,
      canSharePersonalInfo: false,
      escalateAboveAmount: 500
    },
    memory: {
      shortTerm: {
        conversations: [],
        recentEvents: [],
        activeTasks: []
      },
      longTerm: {
        personalityProfile: {},
        learnedPreferences: {},
        relationships: {}
      }
    },
    status: 'active',
    createdAt: new Date(now),
    lastActive: new Date(now)
  };

  db.run(
    `INSERT INTO dimes (id, owner_id, name, personality, decision_boundary, memory, status, created_at, last_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, ownerId, dime.name, JSON.stringify(dime.personality), JSON.stringify(dime.decisionBoundary), JSON.stringify(dime.memory), dime.status, now, now]
  );
  saveDatabase();
  return dime;
}

// Get dime by ID
export function getDime(dimeId: string): Dime | undefined {
  const db = getDb();
  const result = db.exec("SELECT * FROM dimes WHERE id = ?", [dimeId]);
  if (result.length === 0 || result[0].values.length === 0) return undefined;

  const cols = result[0].columns;
  const vals = result[0].values[0];
  const row: any = {};
  cols.forEach((col: string, i: number) => { row[col] = vals[i]; });
  return rowToDime(row);
}

// Get dime by owner
export function getDimeByOwner(ownerId: string): Dime | undefined {
  const db = getDb();
  const result = db.exec("SELECT * FROM dimes WHERE owner_id = ?", [ownerId]);
  if (result.length === 0 || result[0].values.length === 0) return undefined;

  const cols = result[0].columns;
  const vals = result[0].values[0];
  const row: any = {};
  cols.forEach((col: string, i: number) => { row[col] = vals[i]; });
  return rowToDime(row);
}

// Update dime status
export function updateDimeStatus(dimeId: string, status: 'active' | 'paused' | 'idle'): boolean {
  const db = getDb();
  const existing = db.exec("SELECT id FROM dimes WHERE id = ?", [dimeId]);
  if (existing.length === 0 || existing[0].values.length === 0) return false;

  db.run("UPDATE dimes SET status = ?, last_active = ? WHERE id = ?", [status, new Date().toISOString(), dimeId]);
  saveDatabase();
  return true;
}

// Add conversation to memory
export function addConversation(dimeId: string, messages: Message[]): boolean {
  const dime = getDime(dimeId);
  if (!dime) return false;

  dime.memory.shortTerm.conversations.push({
    id: uuidv4(),
    messages,
    timestamp: new Date()
  });
  // Keep only last 10 conversations
  if (dime.memory.shortTerm.conversations.length > 10) {
    dime.memory.shortTerm.conversations.shift();
  }

  const db = getDb();
  db.run("UPDATE dimes SET memory = ?, last_active = ? WHERE id = ?", [JSON.stringify(dime.memory), new Date().toISOString(), dimeId]);
  saveDatabase();
  return true;
}

// Process decision
export interface DecisionRequest {
  context: string;
  options: string[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

export interface DecisionResponse {
  decision: string;
  reasoning: string;
  escalate: boolean;
}

export function processDecision(dimeId: string, request: DecisionRequest): DecisionResponse {
  const dime = getDime(dimeId);
  if (!dime) {
    return {
      decision: '',
      reasoning: 'Dime not found',
      escalate: true
    };
  }

  const shouldEscalate =
    request.urgency === 'critical' ||
    request.urgency === 'high';

  return {
    decision: request.options[0] || 'defer',
    reasoning: `Based on ${dime.personality.decisionStyle} decision style`,
    escalate: shouldEscalate
  };
}

export default {
  createDime,
  getDime,
  getDimeByOwner,
  updateDimeStatus,
  addConversation,
  processDecision,
  personalityQuestions
};

// Add memory/conversation to dime (for service.ts compatibility)
export function addMemory(dimeId: string, type: string, data: any): boolean {
  const dime = getDime(dimeId);
  if (!dime) return false;

  if (type === 'conversation') {
    dime.memory.shortTerm.conversations.push({
      id: uuidv4(),
      messages: [{
        id: uuidv4(),
        sender: data.role === 'user' ? 'owner' : 'dime',
        content: data.content,
        timestamp: data.timestamp || new Date()
      }],
      timestamp: new Date()
    });
    // Keep only last 10 conversations
    if (dime.memory.shortTerm.conversations.length > 10) {
      dime.memory.shortTerm.conversations.shift();
    }
  }

  const db = getDb();
  db.run("UPDATE dimes SET memory = ?, last_active = ? WHERE id = ?", [JSON.stringify(dime.memory), new Date().toISOString(), dimeId]);
  saveDatabase();
  return true;
}

// List all dimes
export function listDimes(): Dime[] {
  const db = getDb();
  const result = db.exec("SELECT * FROM dimes");
  if (result.length === 0) return [];

  const cols = result[0].columns;
  return result[0].values.map((vals: any[]) => {
    const row: any = {};
    cols.forEach((col: string, i: number) => { row[col] = vals[i]; });
    return rowToDime(row);
  });
}

// Alias for processDecision (for service.ts compatibility)
export const makeDecision = processDecision;

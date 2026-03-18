/**
 * dime_base - Agent Management
 * 
 * Handles dime (digital me) agent creation, personality, memory
 */

import { v4 as uuidv4 } from 'uuid';

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
  maxPurchaseAmount: number;      // in vCoins
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
  relationships: Map<string, Relationship>;
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
  trust: number; // 0-100
}

// In-memory store (would be database in production)
const dimes = new Map<string, Dime>();

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

// Create a new dime
export function createDime(ownerId: string, name: string, personality: Partial<DimePersonality>): Dime {
  const dime: Dime = {
    id: uuidv4(),
    ownerId,
    name: name || `${ownerId}_dime`,
    personality: {
      communicationStyle: personality.communicationStyle || 'casual',
      detailLevel: personality.detailLevel || 'balanced',
      decisionStyle: personality.decisionStyle || 'analytical',
      riskTolerance: personality.riskTolerance || 'medium',
      socialPreference: personality.socialPreference || 'selective',
      optimism: personality.optimism || 'realist',
      interests: personality.interests || []
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
        relationships: new Map()
      }
    },
    status: 'active',
    createdAt: new Date(),
    lastActive: new Date()
  };

  dimes.set(dime.id, dime);
  return dime;
}

// Get dime by ID
export function getDime(dimeId: string): Dime | undefined {
  return dimes.get(dimeId);
}

// Get dime by owner
export function getDimeByOwner(ownerId: string): Dime | undefined {
  for (const dime of dimes.values()) {
    if (dime.ownerId === ownerId) {
      return dime;
    }
  }
  return undefined;
}

// Update dime status
export function updateDimeStatus(dimeId: string, status: 'active' | 'paused' | 'idle'): boolean {
  const dime = dimes.get(dimeId);
  if (dime) {
    dime.status = status;
    dime.lastActive = new Date();
    return true;
  }
  return false;
}

// Add conversation to memory
export function addConversation(dimeId: string, messages: Message[]): boolean {
  const dime = dimes.get(dimeId);
  if (dime) {
    dime.memory.shortTerm.conversations.push({
      id: uuidv4(),
      messages,
      timestamp: new Date()
    });
    // Keep only last 10 conversations
    if (dime.memory.shortTerm.conversations.length > 10) {
      dime.memory.shortTerm.conversations.shift();
    }
    dime.lastActive = new Date();
    return true;
  }
  return false;
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
  const dime = dimes.get(dimeId);
  if (!dime) {
    return {
      decision: '',
      reasoning: 'Dime not found',
      escalate: true
    };
  }

  // Simple decision logic (would use LLM in production)
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

/**
 * dime Agent Service
 * 
 * Main service for dime (digital me) agent operations
 * Now uses enhanced memory.ts with all 4 phases
 */

import { createDime, getDime, getDimeByOwner, updateDimeStatus, listDimes, Dime, DimePersonality } from './dime';
import { callLLM, generateAgentResponse, makeDecision as llmMakeDecision } from './llm';
import * as memory from './memory';

export interface CreateDimeRequest {
  ownerId: string;
  name?: string;
  personality?: Partial<DimePersonality>;
}

export interface ChatRequest {
  dimeId: string;
  ownerId: string;  // Required for authorization
  message: string;
}

export interface DecisionRequest {
  dimeId: string;
  ownerId: string;  // Required for authorization
  context: string;
  options: string[];
  urgency?: 'low' | 'medium' | 'high' | 'critical';
}

export interface DimeServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;  // Error code for programmatic handling
}

// Authorization error codes
export const AuthErrorCodes = {
  NOT_FOUND: 'DIME_NOT_FOUND',
  NOT_AUTHORIZED: 'NOT_AUTHORIZED',
  PAUSED: 'DIME_PAUSED'
} as const;

/**
 * Verify ownerId matches the dime's owner
 */
function verifyOwnership(dimeId: string, ownerId: string): Dime | null {
  const dime = getDime(dimeId);
  if (!dime) return null;
  if (dime.ownerId !== ownerId) return null;
  return dime;
}

/**
 * Create a new dime agent
 */
export async function createDimeAgent(request: CreateDimeRequest): Promise<DimeServiceResponse<Dime>> {
  try {
    if (!request.ownerId) {
      return { success: false, error: 'ownerId is required', code: 'INVALID_INPUT' };
    }

    const existing = getDimeByOwner(request.ownerId);
    if (existing) {
      return { 
        success: false, 
        error: 'Owner already has a dime',
        data: existing,
        code: 'ALREADY_EXISTS'
      };
    }

    const dime = createDime(request.ownerId, request.personality, request.name);
    return { success: true, data: dime };
  } catch (error: any) {
    return { success: false, error: error.message, code: 'INTERNAL_ERROR' };
  }
}

/**
 * Get dime by ID or owner
 */
export function getDimeAgent(identifier: string, byOwner: boolean = false): DimeServiceResponse<Dime> {
  try {
    const dime = byOwner ? getDimeByOwner(identifier) : getDime(identifier);
    if (!dime) {
      return { success: false, error: 'Dime not found', code: AuthErrorCodes.NOT_FOUND };
    }
    return { success: true, data: dime };
  } catch (error: any) {
    return { success: false, error: error.message, code: 'INTERNAL_ERROR' };
  }
}

/**
 * Chat with dime agent (requires owner verification)
 * Now uses enhanced memory system with all 4 phases
 */
export async function chatWithDime(request: ChatRequest): Promise<DimeServiceResponse<{ response: string; dime: Dime }>> {
  try {
    const dime = verifyOwnership(request.dimeId, request.ownerId);
    if (!dime) {
      const existing = getDime(request.dimeId);
      if (!existing) {
        return { success: false, error: 'Dime not found', code: AuthErrorCodes.NOT_FOUND };
      }
      return { success: false, error: 'Not authorized to access this Dime', code: AuthErrorCodes.NOT_AUTHORIZED };
    }

    if (dime.status === 'paused') {
      return { success: false, error: 'Dime is paused', code: AuthErrorCodes.PAUSED };
    }

    // Use enhanced memory system (Phase 1-4)
    memory.addMemory(request.dimeId, 'conversation', {
      role: 'user',
      content: request.message,
      timestamp: new Date()
    });

    const dimeData = getDime(request.dimeId);
    const history = dimeData?.memory.shortTerm.conversations || [];
    const recentMessages = history.slice(-5).flatMap((c: any) => c.messages || []);

    const response = await generateAgentResponse(
      dime.personality,
      recentMessages.map((m: any) => ({ role: m.sender, content: m.content })),
      request.message
    );

    memory.addMemory(request.dimeId, 'conversation', {
      role: 'assistant',
      content: response,
      timestamp: new Date()
    });

    return { 
      success: true, 
      data: { 
        response,
        dime: getDime(request.dimeId)!
      } 
    };
  } catch (error: any) {
    return { success: false, error: error.message, code: 'INTERNAL_ERROR' };
  }
}

/**
 * Make a decision with dime agent (requires owner verification)
 */
export async function decideWithDime(request: DecisionRequest): Promise<DimeServiceResponse<{ decision: string; reasoning: string; escalate: boolean }>> {
  try {
    const dime = verifyOwnership(request.dimeId, request.ownerId);
    if (!dime) {
      const existing = getDime(request.dimeId);
      if (!existing) {
        return { success: false, error: 'Dime not found', code: AuthErrorCodes.NOT_FOUND };
      }
      return { success: false, error: 'Not authorized to access this Dime', code: AuthErrorCodes.NOT_AUTHORIZED };
    }

    const result = await llmMakeDecision(
      {
        decisionStyle: dime.personality.decisionStyle,
        riskTolerance: dime.personality.riskTolerance
      },
      request.context,
      request.options
    );

    const shouldEscalate = result.decision === 'defer' || 
      request.urgency === 'critical' ||
      request.urgency === 'high';

    return { 
      success: true, 
      data: { ...result, escalate: shouldEscalate } 
    };
  } catch (error: any) {
    return { success: false, error: error.message, code: 'INTERNAL_ERROR' };
  }
}

/**
 * Update dime status (requires owner verification)
 */
export function setDimeStatus(dimeId: string, ownerId: string, status: 'active' | 'paused' | 'idle'): DimeServiceResponse<boolean> {
  try {
    const dime = verifyOwnership(dimeId, ownerId);
    if (!dime) {
      const existing = getDime(dimeId);
      if (!existing) {
        return { success: false, error: 'Dime not found', code: AuthErrorCodes.NOT_FOUND };
      }
      return { success: false, error: 'Not authorized to modify this Dime', code: AuthErrorCodes.NOT_AUTHORIZED };
    }

    const success = updateDimeStatus(dimeId, status);
    if (!success) {
      return { success: false, error: 'Failed to update status', code: 'UPDATE_FAILED' };
    }
    return { success: true, data: true };
  } catch (error: any) {
    return { success: false, error: error.message, code: 'INTERNAL_ERROR' };
  }
}

/**
 * List all dimes
 */
export function listAllDimes(): DimeServiceResponse<Dime[]> {
  try {
    return { success: true, data: listDimes() };
  } catch (error: any) {
    return { success: false, error: error.message, code: 'INTERNAL_ERROR' };
  }
}

// === Enhanced Memory API (Phase 1-4) ===

/**
 * Search semantic memory
 */
export function searchSemanticMemory(dimeId: string, query: string) {
  const dime = getDime(dimeId);
  if (!dime) return { conversations: [], semantic: [], summaries: [] };
  return memory.searchMemory(dimeId, query);
}

/**
 * Get recent conversations with enhanced memory
 */
export function getRecentConversations(dimeId: string, limit: number = 10) {
  return memory.getRecentConversations(dimeId, limit);
}

/**
 * Get memory summaries
 */
export function getMemorySummaries(dimeId: string) {
  return memory.getMemorySummaries(dimeId);
}

/**
 * Add semantic entry manually
 */
export function addSemanticEntry(dimeId: string, key: string, value: string) {
  return memory.addSemanticEntry(dimeId, key, value);
}

export default {
  createDimeAgent,
  getDimeAgent,
  chatWithDime,
  decideWithDime,
  setDimeStatus,
  listAllDimes,
  searchSemanticMemory,
  getRecentConversations,
  getMemorySummaries,
  addSemanticEntry
};

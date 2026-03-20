/**
 * dime Agent Service
 * 
 * Main service for dime (digital me) agent operations
 */

import { createDime, getDime, getDimeByOwner, updateDimeStatus, addMemory, makeDecision, listDimes, Dime, DimePersonality } from './dime';
import { callLLM, generateAgentResponse, makeDecision as llmMakeDecision } from './llm';

export interface CreateDimeRequest {
  ownerId: string;
  name?: string;
  personality?: Partial<DimePersonality>;
}

export interface ChatRequest {
  dimeId: string;
  message: string;
}

export interface DecisionRequest {
  dimeId: string;
  context: string;
  options: string[];
  urgency?: 'low' | 'medium' | 'high' | 'critical';
}

export interface DimeServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Create a new dime agent
 */
export async function createDimeAgent(request: CreateDimeRequest): Promise<DimeServiceResponse<Dime>> {
  try {
    // Validate owner
    if (!request.ownerId) {
      return { success: false, error: 'ownerId is required' };
    }

    // Check if owner already has a dime
    const existing = getDimeByOwner(request.ownerId);
    if (existing) {
      return { 
        success: false, 
        error: 'Owner already has a dime',
        data: existing 
      };
    }

    // Create dime
    const dime = createDime(request.ownerId, request.personality, request.name);
    return { success: true, data: dime };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get dime by ID or owner
 */
export function getDimeAgent(identifier: string, byOwner: boolean = false): DimeServiceResponse<Dime> {
  try {
    const dime = byOwner ? getDimeByOwner(identifier) : getDime(identifier);
    
    if (!dime) {
      return { success: false, error: 'Dime not found' };
    }
    
    return { success: true, data: dime };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Chat with dime agent
 */
export async function chatWithDime(request: ChatRequest): Promise<DimeServiceResponse<{ response: string; dime: Dime }>> {
  try {
    const dime = getDime(request.dimeId);
    
    if (!dime) {
      return { success: false, error: 'Dime not found' };
    }

    if (dime.status === 'paused') {
      return { success: false, error: 'Dime is paused' };
    }

    // Add user message to memory
    addMemory(request.dimeId, 'conversation', {
      role: 'user',
      content: request.message,
      timestamp: new Date()
    });

    // Get conversation history for context
    const dimeData = getDime(request.dimeId);
    const history = dimeData?.memory.shortTerm.conversations || [];
    const recentMessages = history.slice(-5).flatMap((c: any) => 
      c.messages || []
    );

    // Generate response using LLM
    const response = await generateAgentResponse(
      dime.personality,
      recentMessages.map((m: any) => ({ role: m.sender, content: m.content })),
      request.message
    );

    // Add dime response to memory
    addMemory(request.dimeId, 'conversation', {
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
    return { success: false, error: error.message };
  }
}

/**
 * Make a decision with dime agent
 */
export async function decideWithDime(request: DecisionRequest): Promise<DimeServiceResponse<{ decision: string; reasoning: string; escalate: boolean }>> {
  try {
    const dime = getDime(request.dimeId);
    
    if (!dime) {
      return { success: false, error: 'Dime not found' };
    }

    // Use LLM for decision making
    const result = await llmMakeDecision(
      {
        decisionStyle: dime.personality.decisionStyle,
        riskTolerance: dime.personality.riskTolerance
      },
      request.context,
      request.options
    );

    // Check if should escalate based on boundary
    const shouldEscalate = result.decision === 'defer' || 
      request.urgency === 'critical' ||
      request.urgency === 'high';

    return { 
      success: true, 
      data: { ...result, escalate: shouldEscalate } 
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Update dime status
 */
export function setDimeStatus(dimeId: string, status: 'active' | 'paused' | 'idle'): DimeServiceResponse<boolean> {
  try {
    const success = updateDimeStatus(dimeId, status);
    
    if (!success) {
      return { success: false, error: 'Dime not found' };
    }
    
    return { success: true, data: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * List all dimes
 */
export function listAllDimes(): DimeServiceResponse<Dime[]> {
  try {
    return { success: true, data: listDimes() };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export default {
  createDimeAgent,
  getDimeAgent,
  chatWithDime,
  decideWithDime,
  setDimeStatus,
  listAllDimes
};

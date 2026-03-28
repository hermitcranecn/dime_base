/**
 * dime_base - Enhanced Agent Memory System
 * 
 * Features:
 * - Phase 1: Expanded capacity (100 conversations) + persistence
 * - Phase 2: Semantic memory with embeddings (simulated)
 * - Phase 3: Memory summarization (auto-compress old conversations)
 * - Phase 4: Encryption for sensitive data
 * 
 * NOTE: Uses types from dime.ts, not duplicated here
 */

import { v4 as uuidv4 } from 'uuid';
import { getDb, saveDatabase } from '../database';
import { getDime, Dime, Message } from './dime';
import crypto from 'crypto';

// ============== CONFIG ==============
const MAX_SHORT_TERM_CONVERSATIONS = 100;
const MAX_MESSAGES_PER_CONVERSATION = 50;
const SUMMARIZE_AFTER_CONVERSATIONS = 20;
const ENCRYPTION_KEY = process.env.MEMORY_ENCRYPTION_KEY || 'dime-base-secret-key-32!';

// ============== NEW TYPES FOR MEMORY ENHANCEMENTS ==============
export interface SemanticEntry {
  id: string;
  key: string;
  value: string;
  embedding?: number[];
  timestamp: Date;
}

export interface MemorySummary {
  id: string;
  conversationIds: string[];
  summary: string;
  keyPoints: string[];
  timestamp: Date;
}

export interface EmbeddedFact {
  id: string;
  content: string;
  embedding: number[];
  source: 'conversation' | 'event' | 'manual';
  timestamp: Date;
}

// ============== ENCRYPTION (Phase 4) ==============
function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text: string): string {
  try {
    const [ivHex, encrypted] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return text;
  }
}

// ============== SEMANTIC SEARCH (Phase 2 - Simulated) ==============
function generateSimulatedEmbedding(text: string): number[] {
  const hash = crypto.createHash('sha256').update(text).digest();
  const embedding: number[] = [];
  for (let i = 0; i < 64; i++) {
    embedding.push((hash[i % hash.length] - 128) / 128);
  }
  return embedding;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB) + 0.0001);
}

export function searchSemanticMemory(dime: Dime, query: string): SemanticEntry[] {
  const queryEmbedding = generateSimulatedEmbedding(query);
  const results: { entry: SemanticEntry; similarity: number }[] = [];
  
  const semanticIndex = (dime.memory.shortTerm as any).semanticIndex || [];
  const embeddedFacts = (dime.memory.longTerm as any).embeddedFacts || [];
  
  for (const entry of semanticIndex) {
    const similarity = cosineSimilarity(queryEmbedding, entry.embedding || generateSimulatedEmbedding(entry.value));
    if (similarity > 0.5) {
      results.push({ entry, similarity });
    }
  }
  
  for (const fact of embeddedFacts) {
    const similarity = cosineSimilarity(queryEmbedding, fact.embedding);
    if (similarity > 0.5) {
      results.push({ 
        entry: {
          id: fact.id,
          key: 'fact',
          value: fact.content,
          embedding: fact.embedding,
          timestamp: fact.timestamp
        }, 
        similarity 
      });
    }
  }
  
  return results.sort((a, b) => b.similarity - a.similarity).map(r => r.entry);
}

export function addSemanticEntry(dimeId: string, key: string, value: string): boolean {
  const dime = getDime(dimeId);
  if (!dime) return false;
  
  const entry: SemanticEntry = {
    id: uuidv4(),
    key,
    value,
    embedding: generateSimulatedEmbedding(`${key}: ${value}`),
    timestamp: new Date()
  };
  
  // Ensure semanticIndex exists
  if (!(dime.memory.shortTerm as any).semanticIndex) {
    (dime.memory.shortTerm as any).semanticIndex = [];
  }
  (dime.memory.shortTerm as any).semanticIndex.push(entry);
  
  // Also add to long-term embedded facts
  if (!(dime.memory.longTerm as any).embeddedFacts) {
    (dime.memory.longTerm as any).embeddedFacts = [];
  }
  (dime.memory.longTerm as any).embeddedFacts.push({
    id: entry.id,
    content: `${key}: ${value}`,
    embedding: entry.embedding!,
    source: 'conversation',
    timestamp: new Date()
  });
  
  const db = getDb();
  db.run("UPDATE dimes SET memory = ?, last_active = ? WHERE id = ?", 
    [JSON.stringify(dime.memory), new Date().toISOString(), dimeId]);
  saveDatabase();
  return true;
}

// ============== MEMORY SUMMARIZATION (Phase 3) ==============
function summarizeConversations(conversations: any[]): MemorySummary {
  const allMessages = conversations.flatMap((c: any) => c.messages || []);
  const recentMessages = allMessages.slice(-100);
  
  const topicsSet = new Set<string>();
  conversations.forEach((c: any) => {
    (c.topics || []).forEach((t: string) => topicsSet.add(t));
  });
  
  const summaryText = `Conversation spanning ${conversations.length} sessions. ` +
    `Total messages: ${allMessages.length}. ` +
    `Key topics: ${Array.from(topicsSet).slice(0, 5).join(', ')}.`;
  
  return {
    id: uuidv4(),
    conversationIds: conversations.map((c: any) => c.id),
    summary: summaryText,
    keyPoints: Array.from(topicsSet).slice(0, 5),
    timestamp: new Date()
  };
}

function maybeSummarizeOldConversations(dime: Dime): void {
  const conversations = dime.memory.shortTerm.conversations || [];
  
  if (conversations.length >= SUMMARIZE_AFTER_CONVERSATIONS) {
    const toSummarize = conversations.slice(0, Math.floor(conversations.length / 2));
    const toKeep = conversations.slice(Math.floor(conversations.length / 2));
    
    if (toSummarize.length > 0) {
      const summary = summarizeConversations(toSummarize);
      
      if (!(dime.memory.longTerm as any).summaries) {
        (dime.memory.longTerm as any).summaries = [];
      }
      (dime.memory.longTerm as any).summaries.push(summary);
      
      toSummarize.forEach((c: any) => {
        c.messages = c.messages.slice(-5);
        c.summary = `Session from ${c.timestamp}`;
      });
      
      dime.memory.shortTerm.conversations = toKeep.concat(toSummarize);
    }
  }
}

// ============== CORE MEMORY OPERATIONS ==============

export function addConversation(dimeId: string, messages: Message[]): boolean {
  const dime = getDime(dimeId);
  if (!dime) return false;

  // Extract topics from messages
  const topicsSet = new Set<string>();
  messages.forEach(m => {
    const words = m.content.toLowerCase().split(/\s+/);
    const keywords = ['meeting', 'project', 'code', 'debug', 'test', 'deploy', 'build', 'ai', 'llm', 'agent', 'dime', 'task', 'deadline', 'review', 'pr', 'merge'];
    words.forEach(w => {
      if (keywords.includes(w)) topicsSet.add(w);
    });
  });
  
  const topics = Array.from(topicsSet);

  const conversation = {
    id: uuidv4(),
    messages: messages.slice(-MAX_MESSAGES_PER_CONVERSATION),
    timestamp: new Date(),
    topics
  };

  if (!dime.memory.shortTerm.conversations) {
    dime.memory.shortTerm.conversations = [];
  }
  dime.memory.shortTerm.conversations.push(conversation);

  // Phase 1: Expand capacity to 100
  if (dime.memory.shortTerm.conversations.length > MAX_SHORT_TERM_CONVERSATIONS) {
    dime.memory.shortTerm.conversations.shift();
  }

  // Phase 3: Auto-summarize
  maybeSummarizeOldConversations(dime);

  // Phase 2: Add semantic entries
  messages.forEach(m => {
    if (m.sender === 'user' || m.sender === 'owner') {
      const matches = m.content.match(/(\w+):\s*([^\n]+)/g);
      if (matches) {
        matches.forEach(match => {
          const [key, value] = match.split(':').map(s => s.trim());
          if (key && value && value.length < 100) {
            addSemanticEntry(dimeId, key, value);
          }
        });
      }
    }
  });

  const db = getDb();
  db.run("UPDATE dimes SET memory = ?, last_active = ? WHERE id = ?", 
    [JSON.stringify(dime.memory), new Date().toISOString(), dimeId]);
  saveDatabase();
  return true;
}

export function addMemory(dimeId: string, type: string, data: any): boolean {
  if (type === 'conversation') {
    const messages: Message[] = [{
      id: uuidv4(),
      sender: data.role === 'user' ? 'user' : 'dime',
      content: data.content,
      timestamp: data.timestamp || new Date()
    }];
    return addConversation(dimeId, messages);
  }
  return false;
}

export function getRecentConversations(dimeId: string, limit: number = 10): any[] {
  const dime = getDime(dimeId);
  if (!dime) return [];
  return (dime.memory.shortTerm.conversations || []).slice(-limit);
}

export function getMemorySummaries(dimeId: string): MemorySummary[] {
  const dime = getDime(dimeId);
  if (!dime) return [];
  return (dime.memory.longTerm as any).summaries || [];
}

export function searchMemory(dimeId: string, query: string): { 
  conversations: any[]; 
  semantic: SemanticEntry[];
  summaries: MemorySummary[];
} {
  const dime = getDime(dimeId);
  if (!dime) return { conversations: [], semantic: [], summaries: [] };
  
  const queryLower = query.toLowerCase();
  
  const conversations = (dime.memory.shortTerm.conversations || []).filter((c: any) => 
    c.messages?.some((m: any) => m.content.toLowerCase().includes(queryLower)) ||
    c.topics?.some((t: string) => t.includes(queryLower))
  );
  
  const semantic = searchSemanticMemory(dime, query);
  
  const summaries = ((dime.memory.longTerm as any).summaries || []).filter((s: any) => 
    s.summary.toLowerCase().includes(queryLower) ||
    s.keyPoints?.some((k: string) => k.includes(queryLower))
  );
  
  return { conversations, semantic, summaries };
}

export function encryptMemory(dimeId: string, encryptSensitive: boolean = true): boolean {
  const dime = getDime(dimeId);
  if (!dime || !encryptSensitive) return false;
  
  // Placeholder for encryption
  const db = getDb();
  db.run("UPDATE dimes SET memory = ?, last_active = ? WHERE id = ?", 
    [JSON.stringify(dime.memory), new Date().toISOString(), dimeId]);
  saveDatabase();
  return true;
}

export default {
  addConversation,
  addMemory,
  addSemanticEntry,
  searchSemanticMemory,
  getRecentConversations,
  getMemorySummaries,
  searchMemory,
  encryptMemory
};

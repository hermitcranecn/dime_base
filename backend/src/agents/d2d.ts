/**
 * dime_base - Dime-to-Dime Communication
 *
 * Handles direct communication between dimes
 * Channel management and message history
 */

import { v4 as uuidv4 } from 'uuid';
import { getDb, saveDatabase } from '../database';

// Types
export interface D2DChannel {
  id: string;
  dimeA: string;
  dimeB: string;
  status: 'active' | 'paused' | 'closed';
  createdAt: Date;
  lastActivity: Date;
}

export interface D2DMessage {
  id: string;
  channelId: string;
  fromDimeId: string;
  toDimeId: string;
  content: string;
  timestamp: Date;
}

export interface ConflictResolution {
  escalate: boolean;
  reason: string;
  suggestedAction: string;
}

// In-memory storage for active channels (indexed by dimeId)
const activeChannels = new Map<string, D2DChannel[]>();

// Helper: convert DB row to D2DChannel
function rowToChannel(row: any): D2DChannel {
  return {
    id: row.id,
    dimeA: row.dime_a,
    dimeB: row.dime_b,
    status: row.status,
    createdAt: new Date(row.created_at),
    lastActivity: new Date(row.last_activity)
  };
}

// Helper: convert DB row to D2DMessage
function rowToMessage(row: any): D2DMessage {
  return {
    id: row.id,
    channelId: row.channel_id,
    fromDimeId: row.from_dime_id,
    toDimeId: row.to_dime_id,
    content: row.content,
    timestamp: new Date(row.timestamp)
  };
}

/**
 * Create a new D2D channel between two dimes
 */
export function createD2DChannel(dimeA: string, dimeB: string): { success: boolean; data?: D2DChannel; error?: string; code?: string } {
  if (dimeA === dimeB) {
    return {
      success: false,
      error: 'Cannot create channel with same dime',
      code: 'INVALID_INPUT'
    };
  }

  const db = getDb();

  // Check if channel already exists (in either direction)
  const existing = db.exec(
    "SELECT id FROM d2d_channels WHERE (dime_a = ? AND dime_b = ?) OR (dime_a = ? AND dime_b = ?) AND status != 'closed'",
    [dimeA, dimeB, dimeB, dimeA]
  );

  if (existing.length > 0 && existing[0].values.length > 0) {
    // Return existing channel
    const channelId = existing[0].values[0][0] as string;
    const channel = getD2DChannel(channelId);
    if (channel.success && channel.data) {
      return channel;
    }
  }

  // Create new channel
  const id = uuidv4();
  const now = new Date().toISOString();

  db.run(
    `INSERT INTO d2d_channels (id, dime_a, dime_b, status, created_at, last_activity)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, dimeA, dimeB, 'active', now, now]
  );

  saveDatabase();

  const newChannel: D2DChannel = {
    id,
    dimeA,
    dimeB,
    status: 'active',
    createdAt: new Date(now),
    lastActivity: new Date(now)
  };

  // Update in-memory cache
  if (!activeChannels.has(dimeA)) {
    activeChannels.set(dimeA, []);
  }
  if (!activeChannels.has(dimeB)) {
    activeChannels.set(dimeB, []);
  }
  activeChannels.get(dimeA)!.push(newChannel);
  activeChannels.get(dimeB)!.push(newChannel);

  return {
    success: true,
    data: newChannel
  };
}

/**
 * Get channel by ID
 */
export function getD2DChannel(channelId: string): { success: boolean; data?: D2DChannel; error?: string; code?: string } {
  const db = getDb();
  const result = db.exec("SELECT * FROM d2d_channels WHERE id = ?", [channelId]);

  if (result.length === 0 || result[0].values.length === 0) {
    return {
      success: false,
      error: 'Channel not found',
      code: 'NOT_FOUND'
    };
  }

  const cols = result[0].columns;
  const vals = result[0].values[0];
  const row: any = {};
  cols.forEach((col: string, i: number) => { row[col] = vals[i]; });

  return {
    success: true,
    data: rowToChannel(row)
  };
}

/**
 * Get all channels for a specific dime
 */
export function getD2DChannels(dimeId: string): { success: boolean; data?: D2DChannel[]; error?: string } {
  const db = getDb();
  const result = db.exec(
    "SELECT * FROM d2d_channels WHERE (dime_a = ? OR dime_b = ?) AND status != 'closed' ORDER BY last_activity DESC",
    [dimeId, dimeId]
  );

  if (result.length === 0) {
    return {
      success: true,
      data: []
    };
  }

  const cols = result[0].columns;
  const channels: D2DChannel[] = result[0].values.map((vals: any[]) => {
    const row: any = {};
    cols.forEach((col: string, i: number) => { row[col] = vals[i]; });
    return rowToChannel(row);
  });

  return {
    success: true,
    data: channels
  };
}

/**
 * Send message in a D2D channel
 */
export function sendD2DMessage(
  channelId: string,
  fromDimeId: string,
  content: string
): { success: boolean; data?: D2DMessage; error?: string; code?: string } {
  // Validate channel exists and sender is participant
  const channelResult = getD2DChannel(channelId);
  if (!channelResult.success || !channelResult.data) {
    return {
      success: false,
      error: 'Channel not found',
      code: 'NOT_FOUND'
    };
  }

  const channel = channelResult.data;

  if (channel.dimeA !== fromDimeId && channel.dimeB !== fromDimeId) {
    return {
      success: false,
      error: 'Not authorized to send message in this channel',
      code: 'NOT_AUTHORIZED'
    };
  }

  if (channel.status !== 'active') {
    return {
      success: false,
      error: 'Channel is not active',
      code: 'INVALID_STATE'
    };
  }

  const db = getDb();
  const messageId = uuidv4();
  const now = new Date().toISOString();
  const toDimeId = channel.dimeA === fromDimeId ? channel.dimeB : channel.dimeA;

  // Insert message
  db.run(
    `INSERT INTO d2d_messages (id, channel_id, from_dime_id, to_dime_id, content, timestamp)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [messageId, channelId, fromDimeId, toDimeId, content, now]
  );

  // Update channel last activity
  db.run(
    "UPDATE d2d_channels SET last_activity = ? WHERE id = ?",
    [now, channelId]
  );

  saveDatabase();

  const message: D2DMessage = {
    id: messageId,
    channelId,
    fromDimeId,
    toDimeId,
    content,
    timestamp: new Date(now)
  };

  return {
    success: true,
    data: message
  };
}

/**
 * Get message history for a channel
 */
export function getChannelMessages(channelId: string, limit: number = 100): { success: boolean; data?: D2DMessage[]; error?: string } {
  const db = getDb();
  const result = db.exec(
    "SELECT * FROM d2d_messages WHERE channel_id = ? ORDER BY timestamp DESC LIMIT ?",
    [channelId, limit]
  );

  if (result.length === 0) {
    return {
      success: true,
      data: []
    };
  }

  const cols = result[0].columns;
  const messages: D2DMessage[] = result[0].values.map((vals: any[]) => {
    const row: any = {};
    cols.forEach((col: string, i: number) => { row[col] = vals[i]; });
    return rowToMessage(row);
  }).reverse(); // Return in chronological order

  return {
    success: true,
    data: messages
  };
}

/**
 * Close a D2D channel
 */
export function closeD2DChannel(
  channelId: string,
  requesterDimeId: string
): { success: boolean; data?: D2DChannel; error?: string; code?: string } {
  const channelResult = getD2DChannel(channelId);
  if (!channelResult.success || !channelResult.data) {
    return {
      success: false,
      error: 'Channel not found',
      code: 'NOT_FOUND'
    };
  }

  const channel = channelResult.data;

  // Verify requester is a participant
  if (channel.dimeA !== requesterDimeId && channel.dimeB !== requesterDimeId) {
    return {
      success: false,
      error: 'Not authorized to close this channel',
      code: 'NOT_AUTHORIZED'
    };
  }

  const db = getDb();
  const now = new Date().toISOString();

  db.run(
    "UPDATE d2d_channels SET status = 'closed', last_activity = ? WHERE id = ?",
    [now, channelId]
  );

  saveDatabase();

  // Update in-memory cache
  [channel.dimeA, channel.dimeB].forEach(dimeId => {
    const channels = activeChannels.get(dimeId) || [];
    const index = channels.findIndex(c => c.id === channelId);
    if (index !== -1) {
      channels.splice(index, 1);
    }
  });

  const updatedChannel: D2DChannel = {
    ...channel,
    status: 'closed',
    lastActivity: new Date(now)
  };

  return {
    success: true,
    data: updatedChannel
  };
}

/**
 * Check for potential conflict in conversation
 * This is a simple heuristic - can be enhanced with AI in the future
 */
export function detectConflict(messages: D2DMessage[]): ConflictResolution | null {
  if (messages.length < 2) {
    return null;
  }

  const recentMessages = messages.slice(-10);
  const negativeKeywords = ['disagree', 'wrong', 'cannot', 'refuse', 'reject', 'conflict'];
  const escalationKeywords = ['escalate', 'owner', 'help', 'emergency', 'urgent'];

  let negativeCount = 0;
  let escalationCount = 0;

  recentMessages.forEach(msg => {
    const lowerContent = msg.content.toLowerCase();
    negativeKeywords.forEach(keyword => {
      if (lowerContent.includes(keyword)) negativeCount++;
    });
    escalationKeywords.forEach(keyword => {
      if (lowerContent.includes(keyword)) escalationCount++;
    });
  });

  if (escalationCount > 0) {
    return {
      escalate: true,
      reason: 'Explicit escalation requested',
      suggestedAction: 'Notify owners to intervene'
    };
  }

  if (negativeCount >= 3) {
    return {
      escalate: false,
      reason: 'Potential conflict detected',
      suggestedAction: 'Monitor conversation closely'
    };
  }

  return null;
}

export default {
  createD2DChannel,
  getD2DChannel,
  getD2DChannels,
  sendD2DMessage,
  getChannelMessages,
  closeD2DChannel,
  detectConflict
};

/**
 * dime_base - Feishu Message Processing
 * 
 * Handle messages from Feishu users
 */

import crypto from 'crypto';
import { 
  FeishuMessage, 
  FeishuUser, 
  FeishuCommand,
  COMMANDS,
  WELCOME_MESSAGE,
  HELP_MESSAGE,
  PAUSED_MESSAGE,
  ALREADY_ACTIVE_MESSAGE,
  NOT_FOUND_MESSAGE,
  CREATED_MESSAGE
} from './types';
import { chatWithDime, createDimeAgent, getDimeAgent, setDimeStatus } from '../../agents/service';
import { getDb, saveDatabase } from '../../database';

/**
 * Parse command from message text
 */
export function parseCommand(text: string): FeishuCommand | null {
  const trimmed = text.trim();
  const match = trimmed.match(/^\/(\w+)(?:\s+(.*))?$/);
  
  if (!match) return null;
  
  return {
    command: match[1].toLowerCase(),
    args: match[2]?.split(/\s+/) || []
  };
}

/**
 * Get or create owner from Feishu user
 */
export async function getOrCreateOwner(user: FeishuUser): Promise<string> {
  const db = getDb();
  const openId = user.openId;
  
  // Check if owner exists
  const result = db.exec(
    "SELECT owner_id FROM feishu_links WHERE feishu_open_id = ?",
    [openId]
  );
  
  if (result.length > 0 && result[0].values.length > 0) {
    return result[0].values[0][0] as string;
  }
  
  // Create new owner
  const ownerId = `feishu_${openId}_${Date.now()}`;
  
  db.run(
    "INSERT OR REPLACE INTO feishu_links (owner_id, feishu_open_id, created_at) VALUES (?, ?, ?)",
    [ownerId, openId, new Date().toISOString()]
  );
  saveDatabase();
  
  return ownerId;
}

/**
 * Process command
 */
export async function processCommand(
  command: FeishuCommand,
  ownerId: string,
  user: FeishuUser
): Promise<string> {
  switch (command.command) {
    case COMMANDS.CREATE: {
      // Check if already exists
      const existing = getDimeAgent(ownerId, true);
      if (existing.success && existing.data) {
        return ALREADY_ACTIVE_MESSAGE;
      }
      
      // Create dime
      const result = await createDimeAgent({
        ownerId,
        name: user.name || `${ownerId}_dime`
      });
      
      if (result.success) {
        return CREATED_MESSAGE(result.data?.name || 'Dime');
      }
      return `❌ 创建失败: ${result.error}`;
    }
    
    case COMMANDS.PAUSE: {
      const existing = getDimeAgent(ownerId, true);
      if (!existing.success || !existing.data) {
        return NOT_FOUND_MESSAGE;
      }
      
      await setDimeStatus(existing.data.id, ownerId, 'paused');
      return PAUSED_MESSAGE;
    }
    
    case COMMANDS.RESUME: {
      const existing = getDimeAgent(ownerId, true);
      if (!existing.success || !existing.data) {
        return NOT_FOUND_MESSAGE;
      }
      
      await setDimeStatus(existing.data.id, ownerId, 'active');
      return ALREADY_ACTIVE_MESSAGE;
    }
    
    case COMMANDS.STATUS: {
      const existing = getDimeAgent(ownerId, true);
      if (!existing.success || !existing.data) {
        return NOT_FOUND_MESSAGE;
      }
      
      const dime = existing.data;
      return `💰 状态: ${dime.status}
名称: ${dime.name}
人格: ${dime.personality?.communicationStyle || 'default'}
最后活跃: ${dime.lastActive}`;
    }
    
    case COMMANDS.HELP:
    default:
      return HELP_MESSAGE;
  }
}

/**
 * Process message with dime
 */
export async function processMessage(
  message: FeishuMessage,
  user: FeishuUser
): Promise<string> {
  const content = message.body.content;
  const senderOpenId = message.sender.sender_id.open_id;
  
  // Get or create owner
  const ownerId = await getOrCreateOwner(user);
  
  // Check for command
  const command = parseCommand(content);
  if (command) {
    return processCommand(command, ownerId, user);
  }
  
  // Get dime
  const dimeResult = getDimeAgent(ownerId, true);
  
  if (!dimeResult.success || !dimeResult.data) {
    return NOT_FOUND_MESSAGE;
  }
  
  const dime = dimeResult.data;
  
  // Check if paused
  if (dime.status === 'paused') {
    return PAUSED_MESSAGE;
  }
  
  // Chat with dime
  const chatResult = await chatWithDime({
    dimeId: dime.id,
    ownerId,
    message: content
  });
  
  if (!chatResult.success) {
    return `❌ 处理消息失败: ${chatResult.error}`;
  }
  
  return chatResult.data?.response || '...';
}

/**
 * Verify webhook signature
 */
export function verifySignature(
  signature: string,
  timestamp: string,
  nonce: string,
  encryptKey?: string
): boolean {
  if (!encryptKey) {
    // No encryption, just verify token exists
    return true;
  }
  
  // TODO: Implement actual signature verification
  return true;
}
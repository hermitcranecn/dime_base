/**
 * dime_base - Feishu Webhook Handler
 * 
 * Handle incoming Feishu webhook events
 */

import crypto from 'crypto';
import { FeishuClient } from './client';
import { processMessage, verifySignature } from './message';
import { FeishuEvent, FeishuUser } from './types';
import { getDb } from '../../database';

export class FeishuWebhook {
  private client: FeishuClient;
  private verificationToken: string;
  private encryptKey?: string;

  constructor(
    client: FeishuClient,
    verificationToken: string,
    encryptKey?: string
  ) {
    this.client = client;
    this.verificationToken = verificationToken;
    this.encryptKey = encryptKey;
  }

  /**
   * Verify URL (initial verification from Feishu)
   */
  verifyUrl(challenge: string): string {
    return challenge;
  }

  /**
   * Verify webhook signature
   */
  verify(signature: string, timestamp: string, nonce: string, body: string): boolean {
    // If no encryption key, just check verification token
    if (!this.encryptKey) {
      return true; // Simplified for development
    }

    // Build signature string
    const signStr = `${timestamp}${nonce}${body}`;
    const key = Buffer.from(this.encryptKey, 'utf8');
    const hmac = crypto.createHmac('sha256', key);
    hmac.update(signStr);
    const expectedSignature = hmac.digest('base64');

    return signature === expectedSignature;
  }

  /**
   * Process webhook event
   */
  async processEvent(payload: FeishuEvent): Promise<string | null> {
    const event = payload.event;
    
    if (!event) {
      return null;
    }

    // Handle message events
    if (event.message) {
      return this.handleMessageEvent(event.message, event.operator?.operator_id?.open_id);
    }

    // Handle other events
    switch (payload.type) {
      case 'im.message.message_received':
        // Already handled above
        return null;
      case 'im.chat.member.deleted':
        return this.handleMemberRemoved(event.chat_id, event.operator?.operator_id?.open_id);
      case 'im.chat.member.added':
        return this.handleMemberAdded(event.chat_id, event.operator?.operator_id?.open_id);
      default:
        console.log('Unhandled event type:', payload.type);
        return null;
    }
  }

  /**
   * Handle incoming message
   */
  private async handleMessageEvent(message: any, operatorOpenId?: string): Promise<string> {
    const messageType = message.message_type;
    
    if (messageType !== 'text') {
      console.log('Unsupported message type:', messageType);
      return '';
    }

    // Extract user info
    const senderOpenId = message.sender?.sender_id?.open_id;
    if (!senderOpenId) {
      console.log('No sender open_id in message');
      return '';
    }

    // Get user info
    let user: FeishuUser;
    try {
      user = await this.client.getUserInfo(senderOpenId);
    } catch (e) {
      // Fallback to minimal user
      user = {
        openId: senderOpenId,
        name: 'User'
      };
    }

    // Convert to dime message format
    const dimeMessage = {
      msg_id: message.msg_id,
      sender: {
        sender_id: {
          open_id: senderOpenId
        }
      },
      chat_id: message.chat_id,
      message_type: messageType,
      body: {
        content: message.body?.content || ''
      },
      create_time: message.create_time
    };

    // Process message with dime
    const response = await processMessage(dimeMessage, user);
    
    // Send response back to user
    if (response) {
      try {
        await this.client.sendText(senderOpenId, response);
      } catch (e) {
        console.error('Failed to send response:', e);
      }
    }

    return response;
  }

  /**
   * Handle member removed from chat
   */
  private handleMemberRemoved(chatId: string | undefined, operatorOpenId: string | undefined): string | null {
    if (!operatorOpenId) return null;
    console.log('User removed from chat:', operatorOpenId);
    // Could handle owner removal here
    return null;
  }

  /**
   * Handle member added to chat
   */
  private handleMemberAdded(chatId: string | undefined, operatorOpenId: string | undefined): string | null {
    if (!operatorOpenId) return null;
    
    // Send welcome message to new user
    const welcomeText = `💰 欢迎使用 dime_base！

发送 /create 创建你的数字分身份
发送 /help 获取帮助`;

    this.client.sendText(operatorOpenId, welcomeText).catch(console.error);
    
    return welcomeText;
  }
}

/**
 * Create webhook instance from environment
 */
export function createWebhook(): FeishuWebhook | null {
  const appId = process.env.FEISHU_APP_ID;
  const appSecret = process.env.FEISHU_APP_SECRET;
  const verificationToken = process.env.FEISHU_VERIFICATION_TOKEN;
  const encryptKey = process.env.FEISHU_ENCRYPT_KEY;

  if (!appId || !appSecret || !verificationToken) {
    console.log('Feishu webhook not configured (missing env vars)');
    return null;
  }

  const client = new FeishuClient({
    appId,
    appSecret,
    verificationToken,
    encryptKey
  });

  return new FeishuWebhook(client, verificationToken, encryptKey);
}

export default FeishuWebhook;
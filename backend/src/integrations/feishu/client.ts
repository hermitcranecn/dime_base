/**
 * dime_base - Feishu API Client
 * 
 * Client for Feishu Open API
 */

import fetch from 'node-fetch';
import { FeishuConfig, FeishuUser, FeishuMessage } from './types';

const BASE_URL = 'https://open.feishu.cn/open/apis';

export class FeishuClient {
  private config: FeishuConfig;
  private tenantAccessToken?: string;
  private tokenExpiry?: number;

  constructor(config: FeishuConfig) {
    this.config = config;
  }

  /**
   * Get tenant access token
   */
  async getTenantAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.tenantAccessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.tenantAccessToken;
    }

    const response = await fetch(`${BASE_URL}/auth/v3/tenant_access_token/internal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_id: this.config.appId,
        app_secret: this.config.appSecret
      })
    });

    const data = await response.json() as any;
    
    if (data.code !== 0) {
      throw new Error(`Failed to get tenant access token: ${data.msg}`);
    }

    // Token expires in 2 hours, refresh 5 minutes early
    this.tenantAccessToken = data.tenant_access_token;
    this.tokenExpiry = Date.now() + (data.expire - 300) * 1000;
    
    return this.tenantAccessToken!;
  }

  /**
   * Send message to user
   */
  async sendMessage(
    receiveId: string,
    content: string,
    msgType: 'text' | 'post' = 'text'
  ): Promise<string> {
    const token = await this.getTenantAccessToken();

    const body = msgType === 'text'
      ? JSON.stringify({ text: content })
      : JSON.stringify({ text: content }); // Keep simple for now

    const response = await fetch(`${BASE_URL}/im/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        receive_id: receiveId,
        msg_type: msgType,
        content: body
      })
    });

    const data = await response.json() as any;
    
    if (data.code !== 0) {
      throw new Error(`Failed to send message: ${data.msg}`);
    }

    return data.msg_id;
  }

  /**
   * Send text message (convenience method)
   */
  async sendText(receiveId: string, text: string): Promise<string> {
    return this.sendMessage(receiveId, text, 'text');
  }

  /**
   * Reply to message
   */
  async replyMessage(
    messageId: string,
    content: string,
    msgType: 'text' | 'post' = 'text'
  ): Promise<string> {
    const token = await this.getTenantAccessToken();

    const body = msgType === 'text'
      ? JSON.stringify({ text: content })
      : JSON.stringify({ text: content });

    const response = await fetch(`${BASE_URL}/im/v1/messages/${messageId}/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        msg_type: msgType,
        content: body
      })
    });

    const data = await response.json() as any;
    
    if (data.code !== 0) {
      throw new Error(`Failed to reply message: ${data.msg}`);
    }

    return data.msg_id;
  }

  /**
   * Get user info
   */
  async getUserInfo(openId: string): Promise<FeishuUser> {
    const token = await this.getTenantAccessToken();

    const response = await fetch(`${BASE_URL}/contact/v3/users/${openId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json() as any;
    
    if (data.code !== 0) {
      throw new Error(`Failed to get user info: ${data.msg}`);
    }

    const user = data.data.user;
    return {
      openId: user.open_id,
      unionId: user.union_id,
      name: user.name,
      avatar: user.avatar?.avatar_origin
    };
  }

  /**
   * Upload image
   */
  async uploadImage(imageUrl: string): Promise<string> {
    // TODO: Implement image upload if needed
    return '';
  }

  /**
   * Get bot info
   */
  async getBotInfo(): Promise<any> {
    const token = await this.getTenantAccessToken();

    const response = await fetch(`${BASE_URL}/auth/v3/bot_info`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json() as any;
    
    if (data.code !== 0) {
      throw new Error(`Failed to get bot info: ${data.msg}`);
    }

    return data.data;
  }
}

export default FeishuClient;
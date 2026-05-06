/**
 * dime_base - Feishu Integration
 * 
 * Main module for Feishu bot integration
 */

export { FeishuClient } from './client';
export { FeishuWebhook, createWebhook } from './webhook';
export { processMessage, parseCommand, getOrCreateOwner } from './message';
export * from './types';

/**
 * Initialize Feishu integration
 */
export async function initFeishu(): Promise<boolean> {
  const appId = process.env.FEISHU_APP_ID;
  const appSecret = process.env.FEISHU_APP_SECRET;
  const verificationToken = process.env.FEISHU_VERIFICATION_TOKEN;

  if (!appId || !appSecret || !verificationToken) {
    console.log('Feishu integration not configured');
    return false;
  }

  console.log('💰 Feishu integration initialized');
  return true;
}
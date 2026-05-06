/**
 * dime_base - Feishu API Routes
 * 
 * Express routes for Feishu integration
 */

import { Router, Request, Response } from 'express';
import { FeishuClient } from '../integrations/feishu/client';
import { FeishuWebhook, createWebhook } from '../integrations/feishu/webhook';
import { processMessage } from '../integrations/feishu/message';
import { FeishuEvent } from '../integrations/feishu/types';

const router = Router();

// Initialize Feishu client and webhook
const feishuClient = process.env.FEISHU_APP_ID ? new FeishuClient({
  appId: process.env.FEISHU_APP_ID!,
  appSecret: process.env.FEISHU_APP_SECRET!,
  verificationToken: process.env.FEISHU_VERIFICATION_TOKEN!,
  encryptKey: process.env.FEISHU_ENCRYPT_KEY
}) : null;

const webhook = createWebhook();

/**
 * POST /api/feishu/webhook
 * Feishu webhook receiver
 */
router.post('/webhook', async (req: Request, res: Response) => {
  const { type, challenge, event } = req.body;

  // URL verification (GET for initial setup)
  if (type === 'url_verification') {
    if (webhook) {
      return res.json({ challenge: webhook.verifyUrl(challenge) });
    }
    return res.status(400).json({ error: 'Feishu not configured' });
  }

  // Event callback (POST)
  if (type === 'event_callback') {
    // Verify signature using official Feishu headers
    // Reference: https://open.feishu.cn/document/server-docs/event-subscription-guide/event-subscription-configure-/request-url-configuration-case
    const signature = req.headers['x-lark-signature'] as string;
    const timestamp = req.headers['x-lark-request-timestamp'] as string;
    const nonce = req.headers['x-lark-request-nonce'] as string;

    if (webhook) {
      const bodyStr = JSON.stringify(req.body);
      if (!webhook.verify(signature, timestamp, nonce, bodyStr)) {
        console.error('Feishu webhook signature verification failed');
        return res.status(403).json({ error: 'Invalid signature' });
      }
    }

    // Process event
    if (webhook) {
      await webhook.processEvent(req.body as FeishuEvent);
    }

    return res.json({ success: true });
  }

  res.json({});
});

/**
 * POST /api/feishu/send
 * Send message to Feishu user
 */
router.post('/send', async (req: Request, res: Response) => {
  const { openId, content } = req.body;

  if (!openId || !content) {
    return res.status(400).json({ error: 'openId and content required' });
  }

  if (!feishuClient) {
    return res.status(400).json({ error: 'Feishu not configured' });
  }

  try {
    const msgId = await feishuClient.sendText(openId, content);
    res.json({ success: true, msg_id: msgId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/feishu/status
 * Check bot status
 */
router.get('/status', (req: Request, res: Response) => {
  const configured = !!process.env.FEISHU_APP_ID;
  
  res.json({
    status: configured ? 'ok' : 'not_configured',
    service: 'feishu',
    enabled: configured
  });
});

/**
 * GET /api/feishu/info
 * Get bot info
 */
router.get('/info', async (req: Request, res: Response) => {
  if (!feishuClient) {
    return res.status(400).json({ error: 'Feishu not configured' });
  }

  try {
    const info = await feishuClient.getBotInfo();
    res.json({ success: true, ...info });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
# Feishu Integration for dime_base

## Overview

Integrate dime_base with Feishu (飞书) as the primary IM channel for owner-dime interaction.

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Feishu     │────▶│ dime_base   │────▶│  DeepSeek  │
│  User      │◀────│  Backend   │◀────│   API      │
└─────────────┘     └─────────────┘     └─────────────┘
                         │
                  ┌──────┴──────┐
                  ▼             ▼
            ┌──────────┐  ┌──────────┐
            │  Agent   │  │  RAG     │
            │  Core   │  │  KB      │
            └─────────┘  └──────────┘
```

## Feishu Bot Configuration

### Required Permissions

- `im:message:send_as_bot` - Send messages as bot
- `im:message:receive` - Receive incoming messages
- `im:chat:member.chat:readonly` - Read chat members

### Bot Types

| Bot Type | Use Case | Complexity |
|---------|----------|------------|
| Custom Bot | Single user ↔ Dime chat | Low |
| App Bot | Multi-user, rich features | High |

## Integration Flow

### 1. User Registration (New User)

```
User ──▶ sends message to Feishu Bot ──▶ dime_base
                                       │
                                       ▼
                              Check if owner exists
                                       │
                    ┌──────────────────┴──────────────────┐
                    ▼                                     ▼
              Existing owner                          New owner
                    │                                     │
                    ▼                                     ▼
              Link to existing Dime              Create new Dime + owner
                    │                                     │
                    ▼                                     ▼
              Return onboarding                  Return welcome message
```

### 2. Message Handling

```
Incoming message from Feishu
          │
          ▼
┌─────────────────┐
│  Validate       │
│  owner_id       │
└─────────────────┘
          │
          ▼
┌─────────────────┐
│  Route to      │
│  dime agent    │
└─────────────────┘
          │
          ▼
┌─────────────────┐
│  Chat with      │
│  LLM            │
└─────────────────┘
          │
          ▼
┌─────────────────┐
│  Send response │
│  to Feishu     │
└─────────────────┘
```

### 3. Webhook Events

| Event | Handler |
|-------|---------|
| `im.message.message_received` | Process user message |
| `im.chat.member.deleted` | Handle user leaving |
| `im.chat.member.added` | Handle user joining |

## API Design

### New Endpoints

```
POST   /api/feishu/webhook         Feishu webhook receiver
POST   /api/feishu/register        Register new owner via Feishu
GET    /api/feishu/link/:ownerId    Link Feishu user to owner
POST   /api/feishu/send            Send message to Feishu user
GET    /api/feishu/status          Check bot status
```

### Environment Variables

```bash
# Feishu Configuration
FEISHU_APP_ID=cli_xxxxx
FEISHU_APP_SECRET=xxxxx
FEISHU_VERIFICATION_TOKEN=xxxxx
FEISHU_ENCRYPT_KEY=xxxxx

# dime_base Configuration  
DIME_BASE_URL=http://localhost:3000
DIME_FEISHU_BOT_ENABLED=true
```

## Implementation

### File Structure

```
backend/src/
├── integrations/
│   └── feishu/
│       ├── mod.ts           # Main module
│       ├── types.ts         # Type definitions
│       ├── client.ts       # Feishu API client
│       ├── webhook.ts      # Webhook handler
│       └── message.ts      # Message processing
├── api/
│   └── feishu.ts          # Express routes
└── index.ts               # Mount routes
```

### Core Types

```typescript
// types.ts

export interface FeishuUser {
  openId: string;        // Feishu open_id
  unionId?: string;     // Union ID across apps
  name: string;         // User display name
  avatar?: string;      // Avatar URL
  tenantAccessToken?: string;
}

export interface FeishuMessage {
  msg_id: string;
  root_id?: string;     # For replies
  sender: {
    sender_id: {
      open_id: string;
      user_id?: string;
    };
  };
  chat_id?: string;
  message_type: 'text' | 'post' | 'image' | 'file';
  body: {
    content: string;    # For text messages
  };
  create_time: string;
}

export interface FeishuConfig {
  appId: string;
  appSecret: string;
  verificationToken: string;
  encryptKey?: string;
}
```

### Message Processing

```typescript
// message.ts

import { chatWithDime } from '../../agents/service';
import { FeishuMessage, FeishuUser } from './types';

export async function processMessage(
  message: FeishuMessage,
  sender: FeishuUser
): Promise<string> {
  // Extract message content
  const content = message.body.content;
  const chatId = message.chat_id;
  
  // Get or create owner
  const ownerId = await getOrCreateOwner(sender);
  
  // Get owner's dime
  const dime = await getDimeByOwner(ownerId);
  if (!dime) {
    return "请先创建你的数字分身发送 /create";
  }
  
  // Check if service is paused
  if (dime.status === 'paused') {
    return "你的数字分身份目前暂停服务中。发送 /resume 恢复。";
  }
  
  // Chat with dime
  const result = await chatWithDime({
    dimeId: dime.id,
    ownerId,
    message: content
  });
  
  if (!result.success) {
    return "抱歉，处理你的消息时出错。请稍后重试。";
  }
  
  return result.data?.response || "...";
}

function extractCommands(text: string): { command: string; args: string[] } | null {
  const match = text.match(/^\/(\w+)(?:\s+(.*))?$/);
  if (!match) return null;
  
  return {
    command: match[1],
    args: match[2]?.split(/\s+/) || []
  };
}
```

### Feishu API Client

```typescript
// client.ts

import fetch from 'node-fetch';
import { FeishuConfig, FeishuUser, FeishuMessage } from './types';

const BASE_URL = 'https://open.feishu.cn/open/apis';

export class FeishuClient {
  private config: FeishuConfig;
  private tenantAccessToken?: string;
  
  constructor(config: FeishuConfig) {
    this.config = config;
  }
  
  // Get tenant access token
  async getTenantAccessToken(): Promise<string> {
    if (this.tenantAccessToken) {
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
    
    const data = await response.json();
    this.tenantAccessToken = data.tenant_access_token;
    return this.tenantAccessToken;
  }
  
  // Send message to user
  async sendMessage(
    receiveId: string,
    content: string,
    msgType: 'text' | 'post' = 'text'
  ): Promise<string> {
    const token = await this.getTenantAccessToken();
    
    const response = await fetch(`${BASE_URL}/im/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        receive_id: receiveId,
        msg_type: msgType,
        content: JSON.stringify({ text: content })
      })
    });
    
    const data = await response.json();
    return data.msg_id;
  }
  
  // Upload image
  async uploadImage(imageUrl: string): Promise<string> {
    // TODO: Implement image upload
    return '';
  }
}
```

### Webhook Handler

```typescript
// webhook.ts

import crypto from 'crypto';
import { FeishuMessage } from './types';
import { FeishuClient } from './client';
import { processMessage } from './message';

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
  
  // Verify webhook request
  verify(signature: string, timestamp: string, nonce: string): boolean {
    // TODO: Implement signature verification with encryptKey
    return true;
  }
  
  // Process webhook event
  async processEvent(payload: any): Promise<string | null> {
    const event = payload.event;
    
    if (!event) {
      return null;
    }
    
    switch (event.message?.message_type) {
      case 'text':
        return this.handleTextMessage(event);
      default:
        console.log('Unsupported message type:', event.message?.message_type);
        return null;
    }
  }
  
  private async handleTextMessage(event: any): Promise<string> {
    const message: FeishuMessage = event.message;
    const senderId = message.sender.sender_id.open_id;
    
    // Process message with dime
    const response = await processMessage(message, {
      openId: senderId,
      name: '' // TODO: Fetch user info
    });
    
    // Send response back
    await this.client.sendMessage(senderId, response);
    
    return response;
  }
}
```

### Express Routes

```typescript
// api/feishu.ts

import { Router, Request, Response } from 'express';
import { FeishuClient } from '../integrations/feishu/client';
import { FeishuWebhook } from '../integrations/feishu/webhook';

const router = Router();

// Initialize Feishu client
const feishuClient = new FeishuClient({
  appId: process.env.FEISHU_APP_ID!,
  appSecret: process.env.FEISHU_APP_SECRET!,
  verificationToken: process.env.FEISHU_VERIFICATION_TOKEN!,
  encryptKey: process.env.FEISHU_ENCRYPT_KEY
});

const webhook = new FeishuWebhook(
  feishuClient,
  process.env.FEISHU_VERIFICATION_TOKEN!,
  process.env.FEISHU_ENCRYPT_KEY
);

// Webhook endpoint (POST from Feishu)
router.post('/webhook', async (req: Request, res: Response) => {
  const { type, challenge, event } = req.body;
  
  // URL verification (GET for initial setup)
  if (type === 'url_verification') {
    return res.json({ challenge });
  }
  
  // Event callback (POST)
  if (type === 'event_callback') {
    // Verify signature
    const signature = req.headers['x-feishu-signature'] as string;
    const timestamp = req.headers['x-feishu-timestamp'] as string;
    
    if (!webhook.verify(signature, timestamp, req.body.nonce || '')) {
      return res.status(403).json({ error: 'Invalid signature' });
    }
    
    // Process event
    await webhook.processEvent(req.body);
    
    return res.json({ success: true });
  }
  
  res.json({});
});

// Send message to user
router.post('/send', async (req: Request, res: Response) => {
  const { openId, content } = req.body;
  
  if (!openId || !content) {
    return res.status(400).json({ error: 'openId and content required' });
  }
  
  try {
    const msgId = await feishuClient.sendMessage(openId, content);
    res.json({ success: true, msg_id: msgId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get bot status
router.get('/status', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'feishu',
    enabled: !!process.env.FEISHU_APP_ID
  });
});

export default router;
```

## Commands

| Command | Description |
|---------|-------------|
| `/create` | Create new dime |
| `/pause` | Pause dime |
| `/resume` | Resume dime |
| `/status` | Show dime status |
| `/config` | Configure dime |
| `/help` | Show help |

## Security

### Verification

1. **Verification Token**: Validate webhook requests
2. **Signature**: Verify with encryption key
3. **IP Whitelist**: Only allow Feishu IPs

### Rate Limiting

- Max 100 messages per minute per user
- Max 10 commands per minute per user

## Demo Flow

```
1. User adds Feishu bot 💰
2. Bot sends welcome message with commands
3. User sends /create
4. Bot creates dime and returns confirmation
5. User sends message
6. Bot responds with dime's personality
```

## Next Steps

- [ ] Create Feishu app in console
- [ ] Add environment variables
- [ ] Implement webhook handler
- [ ] Add commands
- [ ] Test with sandbox
- [ ] Deploy to production
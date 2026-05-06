# Dime_Base 模块设计 - Gateway + Channel

## 1. Gateway 模块

### 职责
- 接收外部消息（HTTP/WebSocket）
- 消息分发到对应的 Channel
- 路由到 Agent 处理

### 核心接口

```typescript
// 消息入口
interface Gateway {
  // 启动服务
  start(port: number): void
  
  // 注册 Channel
  registerChannel(channel: Channel): void
  
  // 注册 Agent
  registerAgent(agent: Agent): void
  
  // 消息处理流程
  handleMessage(msg: InboundMessage): Promise<OutboundMessage>
}

// 消息格式
interface InboundMessage {
  channelId: string      // 来源渠道 ID
  channelType: string    // 渠道类型 (feishu/telegram/discord)
  userId: string         // 用户 ID
  userName?: string      // 用户名
  content: string       // 消息内容
  timestamp: number      // 时间戳
  metadata?: Record<string, any>  // 渠道特定数据
}

interface OutboundMessage {
  target: string         // 目标用户/群组
  content: string        // 回复内容
  channelId: string      // 使用的渠道
  metadata?: Record<string, any>
}
```

### 可复用 OpenClaw 代码
- `packages/gateway/` - HTTP 服务器
- `packages/webhooks/` - Webhook 接收
- `packages/server/` - 服务端核心

---

## 2. Channel 模块

### 职责
- 适配不同聊天平台（飞书/Telegram/Discord等）
- 统一消息格式
- 处理平台特定功能（按钮、卡片、表情等）

### Channel 接口

```typescript
abstract class Channel {
  // 渠道标识
  abstract readonly type: string
  
  // 初始化
  async init(config: ChannelConfig): Promise<void>
  
  // 发送消息
  async send(msg: OutboundMessage): Promise<void>
  
  // 处理收到的消息
  parseMessage(payload: any): InboundMessage
  
  // 平台特定功能
  supportsButtons(): boolean
  supportsCards(): boolean
  supportsReactions(): boolean
  supportsVoice(): boolean
}

// 配置格式
interface ChannelConfig {
  enabled: boolean
  credentials: Record<string, string>  // API keys, tokens 等
  options?: {
    allowFrom?: string[]    // 允许的用户白名单
    webhookPath?: string   // Webhook 路径
    webhookPort?: number   // Webhook 端口
  }
}
```

### 需要实现的 Channel

| Channel | 状态 | 说明 |
|---------|------|------|
| **Feishu** | ⭐ 已有 | OpenClaw 已实现，直接复用 |
| **Telegram** | ⭐ 已有 | OpenClaw 已实现，直接复用 |
| **WeChat** | ⭐ 社区插件 | openclaw-wechat-channel |
| **Discord** | ⭐ 已有 | OpenClaw 已实现，直接复用 |
| **WhatsApp** | ⭐ 已有 | OpenClaw 已实现，直接复用 |

---

## 3. 认证与权限 (Auth & Permissions)

### 用户认证流程

```
用户 → Channel → Gateway → Agent → 处理 → 返回
         ↑          ↑
         └─ 认证 ──┘
```

### 认证层级

| 层级 | 说明 | 实现方式 |
|------|------|----------|
| **Channel 认证** | 渠道身份验证 | API Key / Token / Webhook 签名 |
| **用户认证** | 用户身份验证 | Channel UID 映射到内部用户 ID |
| **Agent 认证** | Agent 身份验证 | API Key / JWT |
| **访问控制** | 权限控制 | 白名单/黑名单/角色 |

### Channel 认证方式

| Channel | 认证方式 |
|---------|----------|
| **Feishu** | App ID + App Secret → 获取 tenant_access_token |
| **Telegram** | Bot Token |
| **WeChat** | AppID + AppSecret + Token + EncodingAESKey |
| **Discord** | Bot Token |
| **WhatsApp** | Business API Key |

### 用户映射

```typescript
interface UserMapping {
  channelType: string      // feishu/telegram/wechat
  channelUserId: string    // 渠道用户ID
  internalUserId: string   // 内部用户ID
  name?: string            // 用户名
  avatar?: string          // 头像
  permissions: string[]    // 权限列表
}

// 用户权限示例
const permissions = {
  'admin': ['*'],                    // 所有权限
  'user': ['chat', 'search'],        // 基础对话和搜索
  'guest': ['chat']                   // 仅对话
}
```

### 认证代码复用

可复用 OpenClaw 模块：
- `packages/auth/` - 认证相关
- `packages/credentials/` - 凭证管理
- `packages/allowlist/` - 白名单

---

## 4. 复用方案

### 方案 A：直接集成 OpenClaw 包
```typescript
// 安装 openclaw 为依赖
import { Gateway, FeishuChannel, TelegramChannel } from 'openclaw'

const gateway = new Gateway({
  port: 18789
})

// 复用 Channel
gateway.registerChannel(new FeishuChannel({
  enabled: true,
  credentials: {
    appId: process.env.FEISHU_APP_ID,
    appSecret: process.env.FEISHU_APP_SECRET
  }
}))

await gateway.start()
```

### 方案 B：复制代码自行维护
```
copy: packages/gateway/
copy: packages/channels/feishu/
copy: packages/channels/telegram/
copy: ...
```

**建议**：方案 A，简单高效

---

## 5. 决策确认 (2026-03-29)

- **语言**: TypeScript ✅
- **Channel 复用方案**: 方案 A（直接集成 OpenClaw 包）✅
- **Channel 列表**:
  - Feishu (飞书) ⭐
  - Telegram ⭐
  - WeChat (微信) ⭐ (有社区插件)
- **认证**: 复用 OpenClaw auth 模块 ✅

---

*Last updated: 2026-03-29*

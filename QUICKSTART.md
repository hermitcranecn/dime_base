# dime_base - 快速开始

## 环境要求

- Node.js 18+
- Rust (for ZeroClaw)
- Docker & Docker Compose

## 快速启动

### 1. 安装依赖

```bash
# OpenClaw
cd openclaw && npm install

# Backend
cd ../backend && npm install
```

### 2. 配置环境变量

创建 `backend/.env` 文件：

```bash
# LLM (DeepSeek)
DEEPSEEK_API_KEY=your-api-key
DEEPSEEK_MODEL=deepseek-chat

# Server
PORT=3000
NODE_ENV=development
```

### 3. 启动服务

```bash
# 开发模式
cd backend && npm run dev

# 或使用 Docker
docker-compose up -d
```

## API 使用示例

### 创建 Agent

```bash
curl -X POST http://localhost:3000/api/agents/create \
  -H "Content-Type: application/json" \
  -d '{
    "ownerId": "user123",
    "name": "MyDime",
    "personality": {
      "communicationStyle": "casual",
      "decisionStyle": "analytical",
      "interests": ["Technology", "Reading"]
    }
  }'
```

### 聊天

```bash
curl -X POST http://localhost:3000/api/agents/{dimeId}/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What do you think about AI?"
  }'
```

### 做决定

```bash
curl -X POST http://localhost:3000/api/agents/{dimeId}/decide \
  -H "Content-Type: application/json" \
  -d '{
    "context": "Should I accept this job offer?",
    "options": ["Accept", "Reject", "Counter offer"],
    "urgency": "high"
  }'
```

## 开发

```bash
# 启动后端开发服务器
cd backend
npm run dev

# 构建
npm run build

# 测试
npm test
```

## 项目结构

```
dime_base/
├── openclaw/          # OpenClaw框架
├── zeroclaw/          # ZeroClaw框架  
├── backend/           # Node.js后端
│   └── src/
│       ├── agents/    # Agent核心
│       │   ├── dime.ts
│       │   ├── llm.ts
│       │   └── service.ts
│       └── api/      # REST API
├── frontend/          # (待建)
└── docker-compose.yml
```

---

*💰 dime_base = digital human base station*

# dime_base RAG 知识库系统规划

## 目标
为dime(数字人)构建RAG知识库，使其能够基于用户个人文档、知识进行回答

## 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                      dime_base                              │
├─────────────────────────────────────────────────────────────┤
│  User Query                                                │
│      ↓                                                      │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│  │  Intent    │ →  │   RAG       │ →  │    LLM      │    │
│  │  Detection │    │   Search    │    │   Response  │    │
│  └─────────────┘    └─────────────┘    └─────────────┘    │
│                           ↑                                │
│                    ┌─────────────┐                         │
│                    │  Knowledge  │                         │
│                    │  Vector DB  │                         │
│                    └─────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

## 实现阶段

### Phase 1: 基础RAG (1-2周)

**目标**: 让dime能回答基于知识库的问题

- [ ] 文档上传API
  - 支持PDF/MD/TXT
  - 解析文本内容
  - 分块处理(chunks)

- [ ] 向量存储
  - 使用轻量向量DB (ChromaDB/Milvus Lite)
  - 或直接用SQLite + Simulated Embedding

- [ ] RAG检索API
  - embedding生成
  - 相似度搜索
  - Top-K返回

### Phase 2: 智能路由 (1周)

**目标**: 判断问题是否需要检索知识库

- [ ] Intent Detection
  - 规则判断 (关键词匹配)
  - 简单分类器
  - "需要查知识" vs "闲聊"

- [ ] 多来源融合
  - 知识库检索结果
  - 对话历史
  - 个人偏好

### Phase 3: 知识管理 (1周)

**目标**: 用户可以管理自己的知识库

- [ ] 知识库CRUD
  - 创建/删除知识库
  - 上传/删除文档
  - 查看状态

- [ ] 知识分类
  - 按主题分类
  - 按重要性排序
  - 标签系统

### Phase 4: 进阶功能 (2周)

**目标**: 更智能的知识应用

- [ ] 自动知识更新
  - 定期重新索引
  - 增量更新

- [ ] 多知识源
  - 邮件
  - 日历
  - 笔记应用

- [ ] 个性化知识
  - 学习用户偏好
  - 基于交互扩展

## 技术选型

### 向量数据库
| 方案 | 优点 | 缺点 |
|------|------|------|
| ChromaDB | 轻量、易用 | 功能有限 |
| Milvus Lite | 功能全 | 需要更多资源 |
| SQLite + 自实现 | 无外部依赖 | 需要开发 |

### Embedding
| 方案 | 成本 | 质量 |
|------|------|------|
| DeepSeek | 低 | 中等 |
| OpenAI | 中等 | 高 |
| 本地模型 | 无API成本 | 需要部署 |

### 文档解析
| 方案 | 支持格式 |
|------|----------|
| pdf-parse | PDF |
| marked | Markdown |
| natural | TXT |

## API设计

```typescript
// 上传文档
POST /api/rag/knowledge
{
  ownerId: string,
  title: string,
  content: string,  // 或文件
  category?: string
}

// 查询
POST /api/rag/query
{
  dimeId: string,
  question: string,
  topK?: number
}

// 返回
{
  answer: string,
  sources: [{ chunk, similarity }]
}

// 列出知识库
GET /api/rag/knowledge/:ownerId
```

## 下一步

1. 先确认技术选型（推荐ChromaDB + DeepSeek）
2. 搭建MVP原型
3. 测试效果
4. 迭代优化

需要我开始实现吗？

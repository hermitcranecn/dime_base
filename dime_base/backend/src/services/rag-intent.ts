// RAG Intent Detection - Phase 2
// Determines when to query knowledge base vs direct AI response

interface IntentResult {
  shouldUseRAG: boolean;
  confidence: number;
  intent: 'knowledge_query' | 'general_chat' | 'task' | 'unknown';
  extractedQuery: string;
}

// Simple keyword-based intent detection
// Can be enhanced with LLM-based classification later
const KNOWLEDGE_KEYWORDS = [
  '什么是', '怎么', '如何', '哪个', '告诉我', '查一下', '知识库',
  '文档', '资料', '之前', '以前', '记得', '记录', '说明', '解释',
  '关于', '出自', '来自', '哪来的', '从哪里', '参考', '依据',
  'adas', '产品', '方案', '技术', '规格', '参数', '功能'
];

const TASK_KEYWORDS = [
  '做', '帮我', '请', '创建', '生成', '写', '计算', '总结',
  '翻译', '改写', '优化', '检查', '测试', '运行', '执行'
];

export async function detectIntent(userMessage: string): Promise<IntentResult> {
  const lowerMessage = userMessage.toLowerCase();
  
  // Check knowledge base relevance
  const knowledgeScore = KNOWLEDGE_KEYWORDS.reduce((score, keyword) => {
    if (lowerMessage.includes(keyword.toLowerCase())) {
      return score + 0.15;
    }
    return score;
  }, 0);

  // Check task keywords
  const taskScore = TASK_KEYWORDS.reduce((score, keyword) => {
    if (lowerMessage.includes(keyword.toLowerCase())) {
      return score + 0.1;
    }
    return score;
  }, 0);

  // Determine intent
  let intent: IntentResult['intent'] = 'general_chat';
  let shouldUseRAG = false;
  let confidence = 0.5;

  if (knowledgeScore > 0.3) {
    intent = 'knowledge_query';
    shouldUseRAG = true;
    confidence = Math.min(knowledgeScore, 0.95);
  } else if (taskScore > 0.2) {
    intent = 'task';
    shouldUseRAG = false;
    confidence = Math.min(taskScore, 0.9);
  } else if (knowledgeScore > 0.1) {
    // Low confidence knowledge query - still use RAG but with lower confidence
    intent = 'knowledge_query';
    shouldUseRAG = true;
    confidence = 0.4;
  }

  // Extract clean query for RAG
  const extractedQuery = userMessage
    .replace(/^(帮我|请|告诉我|查一下|什么是|怎么|如何)/i, '')
    .trim();

  return {
    shouldUseRAG,
    confidence,
    intent,
    extractedQuery: extractedQuery || userMessage
  };
}

// Multi-source fusion - combine RAG results with AI response
export async function fuseResponse(
  userMessage: string,
  ragResults: Array<{ content: string; metadata: any; score: number }> | null,
  aiResponse: string
): Promise<string> {
  if (!ragResults || ragResults.length === 0) {
    return aiResponse;
  }

  // If RAG found relevant results, prepend context
  const topResults = ragResults.slice(0, 3);
  const context = topResults.map(r => r.content).join('\n\n');
  
  return `📚 参考知识库:\n${context}\n\n💬 AI回答:\n${aiResponse}`;
}
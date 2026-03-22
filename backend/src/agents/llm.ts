/**
 * dime_base - LLM Integration (DeepSeek)
 * 
 * Uses DeepSeek as the LLM provider for Agent reasoning
 */

import fetch from 'node-fetch';

// Environment variables
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Call DeepSeek LLM API
 */
export async function callLLM(
  messages: LLMMessage[],
  options?: {
    temperature?: number;
    max_tokens?: number;
    model?: string;
  }
): Promise<LLMResponse> {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY not configured');
  }

  const model = options?.model || DEEPSEEK_MODEL;
  const temperature = options?.temperature ?? 0.7;
  const max_tokens = options?.max_tokens ?? 2048;

  const response = await fetch(`${DEEPSEEK_BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LLM API error: ${response.status} - ${error}`);
  }

  const data = await response.json() as any;
  
  return {
    content: data.choices[0]?.message?.content || '',
    usage: data.usage
  };
}

/**
 * Generate Agent response based on personality and context
 */
export async function generateAgentResponse(
  personality: {
    communicationStyle: string;
    detailLevel: string;
    decisionStyle: string;
    interests: string[];
  },
  conversationHistory: { role: string; content: string }[],
  userMessage: string
): Promise<string> {
  const stylePrompt = personality.communicationStyle === 'formal' 
    ? 'Speak formally and professionally.' 
    : personality.communicationStyle === 'playful'
    ? 'Be playful and casual in your responses.'
    : 'Be friendly and conversational.';

  const detailPrompt = personality.detailLevel === 'brief'
    ? 'Keep responses short and concise.'
    : personality.detailLevel === 'detailed'
    ? 'Provide detailed and thorough responses.'
    : 'Balance detail with brevity.';

  const systemPrompt = `You are a digital representation of a human. Your traits:
- Decision style: ${personality.decisionStyle}
- Communication style: ${personality.communicationStyle}
- Interests: ${personality.interests.join(', ')}
- ${stylePrompt}
- ${detailPrompt}

Respond as the human would, considering their personality and preferences.`;

  const messages: LLMMessage[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.map(m => ({
      role: (m.role === 'owner' ? 'user' : m.role) as LLMMessage['role'],
      content: m.content
    })),
    { role: 'user', content: userMessage }
  ];

  const response = await callLLM(messages);
  return response.content;
}

/**
 * Make a decision on behalf of the agent
 */
export async function makeDecision(
  personality: {
    decisionStyle: string;
    riskTolerance: string;
  },
  context: string,
  options: string[]
): Promise<{ decision: string; reasoning: string }> {
  const riskPrompt = personality.riskTolerance === 'high'
    ? 'You are comfortable with high risk and potential rewards.'
    : personality.riskTolerance === 'low'
    ? 'You are conservative and prefer low-risk options.'
    : 'You balance risk and reward.';

  const systemPrompt = `You are helping make a decision. 
Decision style: ${personality.decisionStyle}
${riskPrompt}

Analyze the options and choose the best one. Explain your reasoning.`;

  const userMessage = `Context: ${context}\n\nOptions:\n${options.map((o, i) => `${i + 1}. ${o}`).join('\n')}\n\nWhich option would you choose and why?`;

  const response = await callLLM([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage }
  ]);

  // Extract the decision (first option mentioned)
  const content = response.content;
  const decisionMatch = content.match(/choose\s+(?:option\s+)?(\d+)/i) || content.match(/(\d+)/);
  const decision = decisionMatch 
    ? options[parseInt(decisionMatch[1]) - 1] || options[0]
    : options[0];

  return {
    decision,
    reasoning: content
  };
}

export default {
  callLLM,
  generateAgentResponse,
  makeDecision
};

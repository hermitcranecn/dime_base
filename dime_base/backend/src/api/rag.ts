// RAG API Routes - All Phases
import { Router } from 'express';
import { ragService } from '../services/rag';
import { detectIntent, fuseResponse } from '../services/rag-intent';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// ===== PHASE 1: Basic RAG =====

// POST /api/v1/rag/knowledge - Add document
router.post('/knowledge', async (req, res) => {
  try {
    const { ownerId, content, filename, fileType, tags } = req.body;
    
    if (!ownerId || !content) {
      return res.status(400).json({ error: 'ownerId and content required' });
    }

    const doc = await ragService.addKnowledge(ownerId, content, {
      filename,
      fileType,
      tags
    });

    res.json({ success: true, doc });
  } catch (error: any) {
    console.error('RAG add error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/rag/knowledge/:ownerId - List knowledge
router.get('/knowledge/:ownerId', async (req, res) => {
  try {
    const { ownerId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const docs = await ragService.listKnowledge(ownerId, limit);
    res.json({ success: true, docs, count: docs.length });
  } catch (error: any) {
    console.error('RAG list error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/rag/query - Query knowledge
router.post('/query', async (req, res) => {
  try {
    const { ownerId, query, topK } = req.body;
    
    if (!ownerId || !query) {
      return res.status(400).json({ error: 'ownerId and query required' });
    }

    const result = await ragService.queryKnowledge(ownerId, query, topK || 5);
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('RAG query error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/v1/rag/knowledge/:id - Delete knowledge
router.delete('/knowledge/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await ragService.deleteKnowledge(id);
    res.json({ success: true });
  } catch (error: any) {
    console.error('RAG delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== PHASE 2: Smart Router =====

// POST /api/v1/rag/chat - Chat with intent detection + RAG fusion
router.post('/chat', async (req, res) => {
  try {
    const { ownerId, message } = req.body;
    
    if (!ownerId || !message) {
      return res.status(400).json({ error: 'ownerId and message required' });
    }

    // Step 1: Detect intent
    const intent = await detectIntent(message);
    console.log('Intent detection:', intent);

    let ragResults = null;
    let aiResponse = message; // Placeholder - would integrate with LLM

    // Step 2: If RAG needed, query knowledge base
    if (intent.shouldUseRAG) {
      const queryResult = await ragService.queryKnowledge(
        ownerId, 
        intent.extractedQuery, 
        5
      );
      ragResults = queryResult.results;
    }

    // Step 3: Fuse response (in real implementation, would call LLM here)
    const fusedResponse = await fuseResponse(message, ragResults, aiResponse);

    res.json({
      success: true,
      intent: intent.intent,
      shouldUseRAG: intent.shouldUseRAG,
      confidence: intent.confidence,
      ragResults,
      response: fusedResponse
    });
  } catch (error: any) {
    console.error('RAG chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/rag/intent - Test intent detection
router.get('/intent', async (req, res) => {
  try {
    const { message } = req.query;
    if (!message) {
      return res.status(400).json({ error: 'message required' });
    }
    
    const intent = await detectIntent(message as string);
    res.json({ success: true, intent });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ===== PHASE 3: Knowledge Management =====

// In-memory knowledge base metadata storage (for demo - would use DB in production)
interface KnowledgeBase {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  tags: string[];
  docCount: number;
  createdAt: string;
  updatedAt: string;
}

const knowledgeBases: Map<string, KnowledgeBase> = new Map();

// POST /api/v1/rag/bases - Create knowledge base
router.post('/bases', async (req, res) => {
  try {
    const { ownerId, name, description, tags } = req.body;
    
    if (!ownerId || !name) {
      return res.status(400).json({ error: 'ownerId and name required' });
    }

    const id = uuidv4();
    const kb: KnowledgeBase = {
      id,
      ownerId,
      name,
      description: description || '',
      tags: tags || [],
      docCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    knowledgeBases.set(id, kb);
    res.json({ success: true, knowledgeBase: kb });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/rag/bases/:ownerId - List knowledge bases
router.get('/bases/:ownerId', async (req, res) => {
  try {
    const { ownerId } = req.params;
    const bases = Array.from(knowledgeBases.values()).filter(kb => kb.ownerId === ownerId);
    res.json({ success: true, bases, count: bases.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/v1/rag/bases/:id - Update knowledge base
router.put('/bases/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, tags } = req.body;
    
    const kb = knowledgeBases.get(id);
    if (!kb) {
      return res.status(404).json({ error: 'Knowledge base not found' });
    }

    if (name) kb.name = name;
    if (description !== undefined) kb.description = description;
    if (tags) kb.tags = tags;
    kb.updatedAt = new Date().toISOString();

    res.json({ success: true, knowledgeBase: kb });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/v1/rag/bases/:id - Delete knowledge base
router.delete('/bases/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!knowledgeBases.has(id)) {
      return res.status(404).json({ error: 'Knowledge base not found' });
    }

    knowledgeBases.delete(id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ===== PHASE 4: Advanced Features =====

// POST /api/v1/rag/sync - Sync from external source (email/calendar placeholder)
router.post('/sync', async (req, res) => {
  try {
    const { ownerId, source } = req.body; // source: 'email' | 'calendar'
    
    if (!ownerId || !source) {
      return res.status(400).json({ error: 'ownerId and source required' });
    }

    // Placeholder for Phase 4 - would integrate with email/calendar APIs
    res.json({
      success: true,
      message: `Sync from ${source} not yet implemented`,
      synced: 0
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/rag/stats/:ownerId - Get knowledge stats
router.get('/stats/:ownerId', async (req, res) => {
  try {
    const { ownerId } = req.params;
    
    const docs = await ragService.listKnowledge(ownerId, 1000);
    const bases = Array.from(knowledgeBases.values()).filter(kb => kb.ownerId === ownerId);

    res.json({
      success: true,
      stats: {
        totalDocs: docs.length,
        knowledgeBases: bases.length,
        tags: [...new Set(docs.flatMap(d => d.metadata.tags || []))],
        lastUpdated: docs[0]?.metadata?.createdAt || null
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export const ragRouter = router;
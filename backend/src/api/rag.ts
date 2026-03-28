/**
 * dime_base - RAG API Routes
 * 
 * REST API for knowledge base management
 */

import { Router } from 'express';
import * as rag from '../agents/rag';

const router = Router();

// Initialize RAG on startup
rag.initRAG();

/**
 * POST /api/rag/knowledge
 * Add knowledge document
 */
router.post('/knowledge', (req, res) => {
  try {
    const { ownerId, title, content, category } = req.body;
    
    if (!ownerId || !title || !content) {
      return res.status(400).json({ 
        error: 'ownerId, title, and content are required' 
      });
    }
    
    const doc = rag.addKnowledge(ownerId, title, content, category);
    res.json({ success: true, document: doc });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/rag/knowledge/:ownerId
 * List knowledge documents
 */
router.get('/knowledge/:ownerId', (req, res) => {
  try {
    const { ownerId } = req.params;
    const docs = rag.listKnowledge(ownerId);
    res.json({ success: true, documents: docs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/rag/knowledge/:ownerId/:documentId
 * Get specific document
 */
router.get('/knowledge/:ownerId/:documentId', (req, res) => {
  try {
    const { ownerId, documentId } = req.params;
    const doc = rag.getKnowledge(ownerId, documentId);
    
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    res.json({ success: true, document: doc });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/rag/knowledge/:ownerId/:documentId
 * Delete knowledge document
 */
router.delete('/knowledge/:ownerId/:documentId', (req, res) => {
  try {
    const { ownerId, documentId } = req.params;
    const success = rag.deleteKnowledge(ownerId, documentId);
    
    if (!success) {
      return res.status(404).json({ error: 'Document not found or not authorized' });
    }
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/rag/query
 * Query knowledge base
 */
router.post('/query', (req, res) => {
  try {
    const { ownerId, question, topK } = req.body;
    
    if (!ownerId || !question) {
      return res.status(400).json({ 
        error: 'ownerId and question are required' 
      });
    }
    
    const result = rag.queryKnowledge(ownerId, question, topK);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

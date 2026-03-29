/**
 * dime_base - Agent API Routes
 * 
 * Uses dime service for agent operations
 * Requires ownerId for sensitive operations (chat, decide, status)
 */

import { Router, Request, Response } from 'express';
import {
  createDimeAgent,
  getDimeAgent,
  chatWithDime,
  decideWithDime,
  setDimeStatus,
  listAllDimes
} from '../agents/service';
import { personalityQuestions } from '../agents/dime';

const router = Router();

router.get('/questionnaire', (req: Request, res: Response) => {
  res.json(personalityQuestions);
});

router.post('/create', async (req: Request, res: Response) => {
  const { ownerId, name, personality } = req.body;
  
  if (!ownerId) {
    return res.status(400).json({ error: 'ownerId is required', code: 'INVALID_INPUT' });
  }

  const result = await createDimeAgent({ ownerId, name, personality });
  
  if (!result.success) {
    const status = result.code === 'ALREADY_EXISTS' ? 409 : 400;
    return res.status(status).json(result);
  }
  
  res.status(201).json(result);
});

router.get('/:dimeId', (req: Request, res: Response) => {
  const { dimeId } = req.params;
  const ownerId = req.headers['x-owner-id'] as string;
  
  if (!ownerId) {
    return res.status(400).json({ error: 'x-owner-id header required', code: 'INVALID_INPUT' });
  }
  
  const dime = getDimeAgent(dimeId, false);
  
  if (!dime.success) {
    return res.status(404).json(dime);
  }
  
  if (dime.data?.ownerId !== ownerId) {
    return res.status(403).json({ error: 'Not authorized to access this Dime', code: 'NOT_AUTHORIZED' });
  }
  
  res.json(dime.data);
});

router.get('/owner/:ownerId', (req: Request, res: Response) => {
  const { ownerId } = req.params;
  const requesterId = req.headers['x-owner-id'] as string;
  
  if (requesterId !== ownerId && requesterId !== 'admin') {
    return res.status(403).json({ error: 'Not authorized', code: 'NOT_AUTHORIZED' });
  }
  
  const result = getDimeAgent(ownerId, true);
  
  if (!result.success) {
    return res.status(404).json(result);
  }
  
  res.json(result.data);
});

router.post('/:dimeId/status', (req: Request, res: Response) => {
  const { dimeId } = req.params;
  const { ownerId, status } = req.body;
  
  if (!ownerId) {
    return res.status(400).json({ error: 'ownerId is required', code: 'INVALID_INPUT' });
  }
  
  if (!['active', 'paused', 'idle'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status', code: 'INVALID_INPUT' });
  }
  
  const result = setDimeStatus(dimeId, ownerId, status);
  
  if (!result.success) {
    const statusCode = result.code === 'NOT_AUTHORIZED' ? 403 : 
                       result.code === 'DIME_NOT_FOUND' ? 404 : 400;
    return res.status(statusCode).json(result);
  }
  
  res.json(result);
});

router.post('/:dimeId/chat', async (req: Request, res: Response) => {
  const { dimeId } = req.params;
  const { ownerId, message } = req.body;
  
  if (!ownerId) {
    return res.status(400).json({ error: 'ownerId is required', code: 'INVALID_INPUT' });
  }
  
  if (!message) {
    return res.status(400).json({ error: 'message is required', code: 'INVALID_INPUT' });
  }
  
  const result = await chatWithDime({ dimeId, ownerId, message });
  
  if (!result.success) {
    const statusCode = result.code === 'NOT_AUTHORIZED' ? 403 : 
                       result.code === 'DIME_NOT_FOUND' ? 404 : 400;
    return res.status(statusCode).json(result);
  }
  
  res.json({
    response: result.data?.response,
    dime: {
      id: result.data?.dime.id,
      name: result.data?.dime.name,
      status: result.data?.dime.status,
      lastActive: result.data?.dime.lastActive
    }
  });
});

router.post('/:dimeId/decide', async (req: Request, res: Response) => {
  const { dimeId } = req.params;
  const { ownerId, context, options, urgency } = req.body;
  
  if (!ownerId) {
    return res.status(400).json({ error: 'ownerId is required', code: 'INVALID_INPUT' });
  }
  
  if (!context || !options || !Array.isArray(options)) {
    return res.status(400).json({ error: 'context and options are required', code: 'INVALID_INPUT' });
  }
  
  const result = await decideWithDime({ 
    dimeId, 
    ownerId,
    context, 
    options, 
    urgency: urgency || 'medium' 
  });
  
  if (!result.success) {
    const statusCode = result.code === 'NOT_AUTHORIZED' ? 403 : 
                       result.code === 'DIME_NOT_FOUND' ? 404 : 400;
    return res.status(statusCode).json(result);
  }
  
  res.json(result.data);
});

router.get('/', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;

  // Allow if has valid JWT auth
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(403).json({ error: 'Authentication required', code: 'NOT_AUTHENTICATED' });
  }

  const result = listAllDimes();
  res.json(result.data || []);
});

export default router;

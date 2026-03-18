/**
 * dime_base - Agent API Routes (Updated)
 * 
 * Uses dime service for agent operations
 */

import { Router, Request, Response } from 'express';
import { 
  createDimeAgent, 
  getDimeAgent, 
  chatWithDime, 
  decideWithDime,
  setDimeStatus,
  listAllDimes,
  personalityQuestions 
} from '../agents/service';

const router = Router();

// Get personality questionnaire
router.get('/questionnaire', (req: Request, res: Response) => {
  res.json(personalityQuestions);
});

// Create a new dime
router.post('/create', async (req: Request, res: Response) => {
  const { ownerId, name, personality } = req.body;
  
  if (!ownerId) {
    return res.status(400).json({ error: 'ownerId is required' });
  }

  const result = await createDimeAgent({ ownerId, name, personality });
  
  if (!result.success) {
    return res.status(400).json(result);
  }
  
  res.json(result);
});

// Get dime by ID
router.get('/:dimeId', (req: Request, res: Response) => {
  const { dimeId } = req.params;
  const result = getDimeAgent(dimeId, false);
  
  if (!result.success) {
    return res.status(404).json(result);
  }
  
  res.json(result.data);
});

// Get dime by owner
router.get('/owner/:ownerId', (req: Request, res: Response) => {
  const { ownerId } = req.params;
  const result = getDimeAgent(ownerId, true);
  
  if (!result.success) {
    return res.status(404).json(result);
  }
  
  res.json(result.data);
});

// Update dime status
router.post('/:dimeId/status', (req: Request, res: Response) => {
  const { dimeId } = req.params;
  const { status } = req.body;
  
  if (!['active', 'paused', 'idle'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  
  const result = setDimeStatus(dimeId, status);
  
  if (!result.success) {
    return res.status(404).json(result);
  }
  
  res.json(result);
});

// Chat with dime (with LLM)
router.post('/:dimeId/chat', async (req: Request, res: Response) => {
  const { dimeId } = req.params;
  const { message } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'message is required' });
  }
  
  const result = await chatWithDime({ dimeId, message });
  
  if (!result.success) {
    return res.status(400).json(result);
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

// Make a decision
router.post('/:dimeId/decide', async (req: Request, res: Response) => {
  const { dimeId } = req.params;
  const { context, options, urgency } = req.body;
  
  if (!context || !options || !Array.isArray(options)) {
    return res.status(400).json({ error: 'context and options are required' });
  }
  
  const result = await decideWithDime({ 
    dimeId, 
    context, 
    options, 
    urgency: urgency || 'medium' 
  });
  
  if (!result.success) {
    return res.status(400).json(result);
  }
  
  res.json(result.data);
});

// List all dimes (admin)
router.get('/', (req: Request, res: Response) => {
  const result = listAllDimes();
  res.json(result.data || []);
});

export default router;

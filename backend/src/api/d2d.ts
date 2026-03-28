/**
 * dime_base - D2D API Routes
 *
 * Endpoints for dime-to-dime communication
 */

import { Router, Request, Response } from 'express';
import {
  createD2DChannel,
  getD2DChannel,
  getD2DChannels,
  sendD2DMessage,
  getChannelMessages,
  closeD2DChannel,
  detectConflict
} from '../agents/d2d';

const router = Router();

/**
 * POST /api/d2d/channels
 * Create a new D2D channel between two dimes
 */
router.post('/channels', (req: Request, res: Response) => {
  const { dimeA, dimeB } = req.body;

  if (!dimeA || !dimeB) {
    return res.status(400).json({
      error: 'dimeA and dimeB are required',
      code: 'INVALID_INPUT'
    });
  }

  const result = createD2DChannel(dimeA, dimeB);

  if (!result.success) {
    const statusCode = result.code === 'INVALID_INPUT' ? 400 : 500;
    return res.status(statusCode).json(result);
  }

  res.status(201).json(result);
});

/**
 * GET /api/d2d/channels/:channelId
 * Get channel information and message history
 */
router.get('/channels/:channelId', (req: Request, res: Response) => {
  const { channelId } = req.params;
  const limit = parseInt(req.query.limit as string) || 100;

  const channelResult = getD2DChannel(channelId);

  if (!channelResult.success) {
    return res.status(404).json(channelResult);
  }

  const messagesResult = getChannelMessages(channelId, limit);

  res.json({
    channel: channelResult.data,
    messages: messagesResult.data || [],
    conflict: messagesResult.data ? detectConflict(messagesResult.data) : null
  });
});

/**
 * GET /api/d2d/dimes/:dimeId/channels
 * Get all channels for a specific dime
 */
router.get('/dimes/:dimeId/channels', (req: Request, res: Response) => {
  const { dimeId } = req.params;

  const result = getD2DChannels(dimeId);

  if (!result.success) {
    return res.status(500).json(result);
  }

  res.json(result);
});

/**
 * POST /api/d2d/channels/:channelId/messages
 * Send a message in a D2D channel
 */
router.post('/channels/:channelId/messages', (req: Request, res: Response) => {
  const { channelId } = req.params;
  const { fromDimeId, content } = req.body;

  if (!fromDimeId) {
    return res.status(400).json({
      error: 'fromDimeId is required',
      code: 'INVALID_INPUT'
    });
  }

  if (!content || typeof content !== 'string') {
    return res.status(400).json({
      error: 'content is required and must be a string',
      code: 'INVALID_INPUT'
    });
  }

  if (content.length > 5000) {
    return res.status(400).json({
      error: 'Message content exceeds maximum length of 5000 characters',
      code: 'INVALID_INPUT'
    });
  }

  const result = sendD2DMessage(channelId, fromDimeId, content);

  if (!result.success) {
    const statusCode =
      result.code === 'NOT_FOUND' ? 404 :
      result.code === 'NOT_AUTHORIZED' ? 403 :
      result.code === 'INVALID_STATE' ? 400 : 500;
    return res.status(statusCode).json(result);
  }

  res.status(201).json(result);
});

/**
 * DELETE /api/d2d/channels/:channelId
 * Close a D2D channel
 */
router.delete('/channels/:channelId', (req: Request, res: Response) => {
  const { channelId } = req.params;
  const { requesterDimeId } = req.body;

  if (!requesterDimeId) {
    return res.status(400).json({
      error: 'requesterDimeId is required',
      code: 'INVALID_INPUT'
    });
  }

  const result = closeD2DChannel(channelId, requesterDimeId);

  if (!result.success) {
    const statusCode =
      result.code === 'NOT_FOUND' ? 404 :
      result.code === 'NOT_AUTHORIZED' ? 403 : 500;
    return res.status(statusCode).json(result);
  }

  res.json(result);
});

export default router;

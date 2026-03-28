/**
 * dime_base - Configuration API Routes
 *
 * API endpoints for dime configuration management
 * LLM backend selection, tone, mode, and privacy controls
 */

import { Router, Request, Response } from 'express';
import { getConfig, updateConfig, resetConfig } from '../agents/config';

const router = Router();

/**
 * GET /api/config/:dimeId
 * Get dime configuration
 * Requires x-owner-id header for authorization
 */
router.get('/:dimeId', (req: Request, res: Response) => {
  const { dimeId } = req.params;
  const ownerId = req.headers['x-owner-id'] as string;

  if (!ownerId) {
    return res.status(400).json({ error: 'x-owner-id header required', code: 'INVALID_INPUT' });
  }

  const result = getConfig(dimeId);

  if (!result.success) {
    const statusCode = result.code === 'DIME_NOT_FOUND' ? 404 : 400;
    return res.status(statusCode).json(result);
  }

  // Verify ownership before returning config
  const { getDime } = require('../agents/dime');
  const dime = getDime(dimeId);

  if (dime && dime.ownerId !== ownerId) {
    return res.status(403).json({ error: 'Not authorized to access this Dime', code: 'NOT_AUTHORIZED' });
  }

  // Don't expose API keys in responses
  const sanitizedConfig = { ...result.data };
  if (sanitizedConfig.apiKey) {
    sanitizedConfig.apiKey = '***';
  }

  res.json({ success: true, data: sanitizedConfig });
});

/**
 * PUT /api/config/:dimeId
 * Update dime configuration
 * Requires x-owner-id header for authorization
 */
router.put('/:dimeId', (req: Request, res: Response) => {
  const { dimeId } = req.params;
  const ownerId = req.headers['x-owner-id'] as string;

  if (!ownerId) {
    return res.status(400).json({ error: 'x-owner-id header required', code: 'INVALID_INPUT' });
  }

  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: 'No configuration updates provided', code: 'INVALID_INPUT' });
  }

  const result = updateConfig(dimeId, ownerId, req.body);

  if (!result.success) {
    const statusCode = result.code === 'DIME_NOT_FOUND' ? 404 :
                       result.code === 'NOT_AUTHORIZED' ? 403 :
                       result.code === 'INVALID_CONFIG' ? 400 : 500;
    return res.status(statusCode).json(result);
  }

  // Don't expose API keys in responses
  const sanitizedConfig = { ...result.data };
  if (sanitizedConfig.apiKey) {
    sanitizedConfig.apiKey = '***';
  }

  res.json({ success: true, data: sanitizedConfig });
});

/**
 * POST /api/config/:dimeId/reset
 * Reset dime configuration to defaults
 * Requires x-owner-id header for authorization
 */
router.post('/:dimeId/reset', (req: Request, res: Response) => {
  const { dimeId } = req.params;
  const ownerId = req.headers['x-owner-id'] as string;

  if (!ownerId) {
    return res.status(400).json({ error: 'x-owner-id header required', code: 'INVALID_INPUT' });
  }

  const result = resetConfig(dimeId, ownerId);

  if (!result.success) {
    const statusCode = result.code === 'DIME_NOT_FOUND' ? 404 :
                       result.code === 'NOT_AUTHORIZED' ? 403 : 500;
    return res.status(statusCode).json(result);
  }

  res.json({ success: true, data: result.data });
});

export default router;

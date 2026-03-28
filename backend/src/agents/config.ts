/**
 * dime_base - Dime Configuration Service
 *
 * Handles configuration operations for dimes
 * LLM backend selection, tone, mode, and privacy controls
 */

import { getDime, DimeConfig, Dime } from './dime';
import { getDb, saveDatabase } from '../database';

export interface ConfigUpdateRequest {
  llmBackend?: 'deepseek' | 'openai' | 'anthropic' | 'custom';
  customEndpoint?: string;
  apiKey?: string;
  tone?: 'formal' | 'casual' | 'playful';
  mode?: 'assistant' | 'creative' | 'analytical';
  privacy?: {
    dataSharing?: boolean;
    conversationRetention?: number;
  };
}

export interface ConfigServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

/**
 * Get default configuration
 */
function getDefaultConfig(): DimeConfig {
  return {
    llmBackend: 'deepseek',
    tone: 'casual',
    mode: 'assistant',
    privacy: {
      dataSharing: false,
      conversationRetention: 30
    }
  };
}

/**
 * Validate configuration
 */
function validateConfig(config: ConfigUpdateRequest): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (config.llmBackend && !['deepseek', 'openai', 'anthropic', 'custom'].includes(config.llmBackend)) {
    errors.push('Invalid llmBackend value');
  }

  if (config.llmBackend === 'custom' && !config.customEndpoint) {
    errors.push('customEndpoint is required when llmBackend is custom');
  }

  if (config.tone && !['formal', 'casual', 'playful'].includes(config.tone)) {
    errors.push('Invalid tone value');
  }

  if (config.mode && !['assistant', 'creative', 'analytical'].includes(config.mode)) {
    errors.push('Invalid mode value');
  }

  if (config.privacy?.conversationRetention !== undefined) {
    if (config.privacy.conversationRetention < 0 || config.privacy.conversationRetention > 365) {
      errors.push('conversationRetention must be between 0 and 365 days');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get dime configuration
 */
export function getConfig(dimeId: string): ConfigServiceResponse<DimeConfig> {
  try {
    const dime = getDime(dimeId);
    if (!dime) {
      return { success: false, error: 'Dime not found', code: 'DIME_NOT_FOUND' };
    }

    return { success: true, data: dime.config };
  } catch (error: any) {
    return { success: false, error: error.message, code: 'INTERNAL_ERROR' };
  }
}

/**
 * Update dime configuration
 */
export function updateConfig(dimeId: string, ownerId: string, updates: ConfigUpdateRequest): ConfigServiceResponse<DimeConfig> {
  try {
    const dime = getDime(dimeId);
    if (!dime) {
      return { success: false, error: 'Dime not found', code: 'DIME_NOT_FOUND' };
    }

    // Verify ownership
    if (dime.ownerId !== ownerId) {
      return { success: false, error: 'Not authorized to modify this Dime', code: 'NOT_AUTHORIZED' };
    }

    // Validate updates
    const validation = validateConfig(updates);
    if (!validation.valid) {
      return { success: false, error: `Invalid configuration: ${validation.errors.join(', ')}`, code: 'INVALID_CONFIG' };
    }

    // Merge updates with existing config
    const newConfig: DimeConfig = {
      ...dime.config,
      ...updates,
      privacy: {
        ...dime.config.privacy,
        ...updates.privacy,
        dataSharing: updates.privacy?.dataSharing ?? dime.config.privacy.dataSharing,
        conversationRetention: updates.privacy?.conversationRetention ?? dime.config.privacy.conversationRetention
      }
    };

    // Remove custom endpoint/api key if not using custom backend
    if (newConfig.llmBackend !== 'custom') {
      delete newConfig.customEndpoint;
      delete newConfig.apiKey;
    }

    // Update in database
    const db = getDb();
    db.run(
      "UPDATE dimes SET config = ?, last_active = ? WHERE id = ?",
      [JSON.stringify(newConfig), new Date().toISOString(), dimeId]
    );
    saveDatabase();

    return { success: true, data: newConfig };
  } catch (error: any) {
    return { success: false, error: error.message, code: 'INTERNAL_ERROR' };
  }
}

/**
 * Reset dime configuration to defaults
 */
export function resetConfig(dimeId: string, ownerId: string): ConfigServiceResponse<DimeConfig> {
  try {
    const dime = getDime(dimeId);
    if (!dime) {
      return { success: false, error: 'Dime not found', code: 'DIME_NOT_FOUND' };
    }

    // Verify ownership
    if (dime.ownerId !== ownerId) {
      return { success: false, error: 'Not authorized to modify this Dime', code: 'NOT_AUTHORIZED' };
    }

    const defaultConfig = getDefaultConfig();

    // Update in database
    const db = getDb();
    db.run(
      "UPDATE dimes SET config = ?, last_active = ? WHERE id = ?",
      [JSON.stringify(defaultConfig), new Date().toISOString(), dimeId]
    );
    saveDatabase();

    return { success: true, data: defaultConfig };
  } catch (error: any) {
    return { success: false, error: error.message, code: 'INTERNAL_ERROR' };
  }
}

export default {
  getConfig,
  updateConfig,
  resetConfig,
  getDefaultConfig
};

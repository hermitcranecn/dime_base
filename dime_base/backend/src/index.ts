// Load env FIRST, before any imports
import dotenv from 'dotenv';
dotenv.config({ path: '/home/hermitwang/.openclaw/workspace/dime_base/.env' });

import express from 'express';
import path from 'path';
import { chatRouter } from './api/chat';
import { docsRouter } from './api/docs';
import { tasksRouter } from './api/tasks';
import { feishuRouter } from './api/feishu';
import { ragRouter } from './api/rag';
import { initScheduler } from './services/scheduler';

console.log('FEISHU_APP_ID:', process.env.FEISHU_APP_ID);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.use('/api/v1/chat', chatRouter);
app.use('/api/v1/docs', docsRouter);
app.use('/api/v1/tasks', tasksRouter);
app.use('/api/v1/feishu', feishuRouter);
app.use('/api/v1/rag', ragRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
function start() {
  // Initialize scheduler (no DB needed)
  initScheduler();
  console.log('✓ Scheduler started');

  app.listen(PORT, () => {
    console.log(`🚀 Dime Base API running on port ${PORT}`);
  });
}

start();

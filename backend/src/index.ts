/**
 * dime_base Backend - Main Entry Point
 * 
 * Digital Human Base Station - Backend API Server
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

import { initWebSocket } from './websocket';
import { initDatabase } from './database';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// CORS configuration - restrict origins in production
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

const io = new Server(httpServer, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: CORS_ORIGIN !== '*'
  }
});

initWebSocket(httpServer, io);

const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'dime_base',
    version: '1.0.0'
  });
});

import agentRoutes from './api/agents';
import worldRoutes from './api/world';
import economyRoutes from './api/economy';
import ragRoutes from './api/rag';
import authRoutes from './api/auth';

app.use('/api/agents', agentRoutes);
app.use('/api/world', worldRoutes);
app.use('/api/economy', economyRoutes);
app.use('/api/rag', ragRoutes);
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.json({
    name: 'dime_base',
    fullName: 'Digital Human Base Station',
    version: '1.0.0',
    endpoints: {
      agents: '/api/agents',
      world: '/api/world',
      economy: '/api/economy',
      rag: '/api/rag'
    }
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    websocket: 'connected',
    timestamp: new Date().toISOString()
  });
});

initDatabase().then(() => {
httpServer.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   💰 dime_base                                          ║
║   Digital Human Base Station                             ║
║                                                           ║
║   Server running on port ${PORT}                           ║
║   WebSocket: enabled                                     ║
║   CORS Origin: ${CORS_ORIGIN}                            ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});
}).catch((err) => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

export { app, io, httpServer };

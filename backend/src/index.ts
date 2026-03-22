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
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Initialize WebSocket
initWebSocket(httpServer);

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'dime_base',
    version: '1.0.0'
  });
});

// API Routes
import agentRoutes from './api/agents';
import worldRoutes from './api/world';
import economyRoutes from './api/economy';

app.use('/api/agents', agentRoutes);
app.use('/api/world', worldRoutes);
app.use('/api/economy', economyRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'dime_base',
    fullName: 'Digital Human Base Station',
    version: '1.0.0',
    endpoints: {
      agents: '/api/agents',
      world: '/api/world',
      economy: '/api/economy'
    }
  });
});

// WebSocket status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    websocket: 'connected',
    timestamp: new Date().toISOString()
  });
});

// Initialize database and start server
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
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});
}).catch((err) => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

export { app, io, httpServer };

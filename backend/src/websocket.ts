/**
 * dime_base - WebSocket Handler
 * Real-time communication for dime agents
 */

import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { v4 as uuidv4 } from 'uuid';

interface ConnectedUser {
  userId: string;
  dimeId?: string;
  socketId: string;
}

interface ChatMessage {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: Date;
  type: 'owner-to-dime' | 'dime-to-owner' | 'dime-to-dime';
}

// Connected users map
const connectedUsers = new Map<string, ConnectedUser>();
const userSockets = new Map<string, string>(); // socketId -> userId

export function initWebSocket(httpServer: HttpServer, io: SocketIOServer): SocketIOServer {
  // io is passed from index.ts where CORS is configured

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // User authentication
    socket.on('auth', (userId: string) => {
      connectedUsers.set(socket.id, {
        userId,
        socketId: socket.id
      });
      userSockets.set(socket.id, userId);
      socket.join(`user:${userId}`);
      console.log(`User ${userId} authenticated`);
    });

    // Join dime room
    socket.on('join_dime', (dimeId: string) => {
      const user = connectedUsers.get(socket.id);
      if (user) {
        user.dimeId = dimeId;
        connectedUsers.set(socket.id, user);
        socket.join(`dime:${dimeId}`);
        console.log(`User joined dime: ${dimeId}`);
      }
    });

    // Send message to dime
    socket.on('message_to_dime', (data: { dimeId: string; message: string }) => {
      const user = connectedUsers.get(socket.id);
      if (user) {
        io.to(`dime:${data.dimeId}`).emit('dime_message', {
          id: uuidv4(),
          from: user.userId,
          content: data.message,
          timestamp: new Date()
        });
      }
    });

    // Dime-to-dime communication
    socket.on('dime_to_dime', (data: { toDimeId: string; fromDimeId: string; message: string }) => {
      io.to(`dime:${data.toDimeId}`).emit('dime_message', {
        id: uuidv4(),
        fromDimeId: data.fromDimeId,
        content: data.message,
        timestamp: new Date(),
        type: 'dime-to-dime'
      });
    });

    // Get online dimes
    socket.on('get_online_dimes', () => {
      const onlineDimes = Array.from(connectedUsers.values())
        .filter(u => u.dimeId)
        .map(u => u.dimeId);
      socket.emit('online_dimes', onlineDimes);
    });

    // Typing indicator
    socket.on('typing', (data: { dimeId: string; isTyping: boolean }) => {
      socket.to(`dime:${data.dimeId}`).emit('typing', {
        userId: connectedUsers.get(socket.id)?.userId,
        isTyping: data.isTyping
      });
    });

    // D2D channel creation
    socket.on('d2d_create_channel', (data: { dimeA: string; dimeB: string }) => {
      const { createD2DChannel } = require('./agents/d2d');
      const result = createD2DChannel(data.dimeA, data.dimeB);

      if (result.success && result.data) {
        // Notify both dimes
        io.to(`dime:${data.dimeA}`).emit('d2d_channel_created', result.data);
        io.to(`dime:${data.dimeB}`).emit('d2d_channel_created', result.data);
      } else {
        socket.emit('d2d_channel_error', result);
      }
    });

    // D2D message sending
    socket.on('d2d_send_message', (data: { channelId: string; fromDimeId: string; content: string }) => {
      const { sendD2DMessage, getD2DChannel } = require('./agents/d2d');
      const result = sendD2DMessage(data.channelId, data.fromDimeId, data.content);

      if (result.success && result.data) {
        const channelResult = getD2DChannel(data.channelId);
        if (channelResult.success && channelResult.data) {
          const channel = channelResult.data;
          // Broadcast to both dimes in the channel
          io.to(`dime:${channel.dimeA}`).emit('d2d_message', result.data);
          io.to(`dime:${channel.dimeB}`).emit('d2d_message', result.data);
        }
      } else {
        socket.emit('d2d_message_error', result);
      }
    });

    // D2D channel closure
    socket.on('d2d_close_channel', (data: { channelId: string; requesterDimeId: string }) => {
      const { closeD2DChannel, getD2DChannel } = require('./agents/d2d');
      const result = closeD2DChannel(data.channelId, data.requesterDimeId);

      if (result.success && result.data) {
        const channel = result.data;
        // Notify both dimes that channel is closed
        io.to(`dime:${channel.dimeA}`).emit('d2d_channel_closed', result.data);
        io.to(`dime:${channel.dimeB}`).emit('d2d_channel_closed', result.data);
      } else {
        socket.emit('d2d_channel_error', result);
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      const user = connectedUsers.get(socket.id);
      if (user) {
        console.log(`User ${user.userId} disconnected`);
        connectedUsers.delete(socket.id);
        userSockets.delete(socket.id);
      }
    });
  });

  // Note: broadcastDimeStatus is called from outside to emit status changes
  // See the exported function below

  console.log('💰 WebSocket server initialized');
  return io;
}

/**
 * Send notification to user
 */
export function notifyUser(io: SocketIOServer, userId: string, event: string, data: any) {
  io.to(`user:${userId}`).emit(event, data);
}

/**
 * Broadcast dime event
 */
export function broadcastDimeEvent(io: SocketIOServer, dimeId: string, event: string, data: any) {
  io.to(`dime:${dimeId}`).emit(event, data);
}

/**
 * Broadcast dime status change to all connected clients
 */
export function broadcastDimeStatus(io: SocketIOServer, dimeId: string, status: string) {
  io.emit('dime_status', { dimeId, status });
}

/**
 * Get connected user count
 */
export function getConnectedCount(): number {
  return connectedUsers.size;
}

export default {
  initWebSocket,
  notifyUser,
  broadcastDimeEvent,
  broadcastDimeStatus,
  getConnectedCount
};

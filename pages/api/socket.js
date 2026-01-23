import { Server } from 'socket.io';
import { detectHateSpeech, censorMessage } from '../../lib/moderation';

const ROOM = 'room';

export default function handler(req, res) {
  if (!res.socket.server.io) {
    console.log('Setting up Socket.IO server...');
    
    const io = new Server(res.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    io.on('connection', (socket) => {
      console.log('A user connected:', socket.id);

      socket.on('joinChat', async (userName) => {
        await socket.join(ROOM);
        console.log(`${userName} joined the chat`);
        
        // Broadcast to other users in the room
        socket.to(ROOM).emit('roomNotice', userName);

        socket.on('sendMessage', (msg) => {
          console.log('Message received:', msg);
          
          // Check for hate speech
          const isHateSpeech = detectHateSpeech(msg.message);
          console.log('Hate speech detected:', isHateSpeech);
          
          // Create message to broadcast
          let messageToSend = { ...msg };
          if (isHateSpeech) {
            messageToSend.message = censorMessage(msg.message);
          }
          
          socket.to(ROOM).emit('sendMessage', messageToSend);
        });
      });

      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
      });
    });

    res.socket.server.io = io;
  } else {
    console.log('Socket.IO server already running');
  }
  
  res.end();
}
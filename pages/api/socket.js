import { Server } from 'socket.io';
import { detectHateSpeech, censorMessage } from '../../lib/moderation';

const ROOM = 'room';
// In-memory violation counter for each socket
const violationCounts = new Map();
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
      
      // Initialize violation counter
      violationCounts.set(socket.id, 0);

      socket.on('joinChat', async (userName) => {
        await socket.join(ROOM);
        console.log(`${userName} joined the chat`);
        
        // Broadcast to other users in the room
        socket.to(ROOM).emit('roomNotice', userName);

        socket.on('sendMessage', async (msg) => {
          console.log('Message received:', msg);
          
          // Check for hate speech using enhanced detection (keywords + ML)
          const hateSpeechResult = await detectHateSpeech(msg.message);
          const isHateSpeech = hateSpeechResult.isHate;
          
          console.log('Hate speech detected:', isHateSpeech);
          console.log('Detection method:', hateSpeechResult.detectionMethod);
          
          // Create message to broadcast
          let messageToSend = { ...msg };
          if (isHateSpeech) {
            // For ML-detected hate speech, censor more aggressively
            if (hateSpeechResult.detectionMethod === 'ml') {
              // Replace the entire message with asterisks for ML-detected content
              messageToSend.message = '*'.repeat(msg.message.length);
            } else {
              // Use keyword-based censoring for keyword detection
              messageToSend.message = censorMessage(msg.message);
            }
            
            // Increment violation counter
            const currentCount = violationCounts.get(socket.id) || 0;
            const newCount = currentCount + 1;
            violationCounts.set(socket.id, newCount);
            
            // Send warning to sender only with detection method info
            const detectionInfo = hateSpeechResult.detectionMethod === 'keywords' ? 
              'detected by content filter' : 
              'detected by AI analysis';
            
            if (newCount >= 3) {
              socket.emit('warning', {
                message: `FINAL WARNING: You have violated community guidelines 3 times. Continued violations may result in restrictions.`
              });
            } else {
              socket.emit('warning', {
                message: `Hate speech was ${detectionInfo} in your message. Your message has been censored. Warning ${newCount}/3.`
              });
            }
          }
          
          socket.to(ROOM).emit('sendMessage', messageToSend);
        });
      });

      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        
        // Clean up violation counter
        violationCounts.delete(socket.id);
      });
    });

    res.socket.server.io = io;
  } else {
    console.log('Socket.IO server already running');
  }
  
  res.end();
}
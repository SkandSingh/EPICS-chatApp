import { createServer } from 'node:http';
import express from 'express';
import {Server} from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

const ROOM='room';

io.on('connection', (socket) => {
  console.log('a user connected', socket.id);

  socket.on('joinChat', async(userName)=> {
    await socket.join(ROOM);

    //broadcast
    socket.to(ROOM).emit('roomNotice',userName);

    socket.on('sendMessage', (msg)=> {
      socket.to(ROOM).emit('sendMessage', msg);
    })
  })

});

app.get('/', (req, res) => {
  res.send('<h1>Hello world</h1>');
});

server.listen(4000, () => {
  console.log('server running at http://localhost:4000');
});
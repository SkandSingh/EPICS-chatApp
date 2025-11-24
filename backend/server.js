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

io.on('connection', (socket) => {
  console.log('a user connected', socket.id);
});

app.get('/', (req, res) => {
  res.send('<h1>Hello world</h1>');
});

server.listen(4000, () => {
  console.log('server running at http://localhost:4000');
});
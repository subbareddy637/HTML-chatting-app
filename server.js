const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
app.use(express.static('public'));
const room = 'room123'; // fixed room

io.on('connection', socket => {
  socket.join(room);
  socket.on('signal', data => {
    socket.to(room).emit('signal', data);
  });
});
const port = process.env.PORT || 3000;
server.listen(port, () => console.log('Signaling server listening on', port));

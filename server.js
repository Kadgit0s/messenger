const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  if (req.url === "/") {
    fs.readFile(path.join(__dirname, 'client', 'index.html'), (err, data) => {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  }
});

const wsServer = new WebSocket.Server({ server });

let users = {}; // Store user connections

wsServer.on('connection', function (ws) {
  ws.on('message', function (data) {
    const message = JSON.parse(data);
    
    // Handle user registration
    if (message.type === 'register') {
      users[message.nickname] = ws;
      broadcastUserList();
      return;
    }

    // Handle private messages
    if (message.type === 'private_message') {
      const recipientSocket = users[message.to];
      if (recipientSocket) {
        const privateMessage = {
          from: message.from,
          message: message.message,
          type: 'private_message'
        };
        recipientSocket.send(JSON.stringify(privateMessage));
      }
    }
  });

  ws.on('close', () => {
    for (let nickname in users) {
      if (users[nickname] === ws) {
        delete users[nickname];
        broadcastUserList();
        break;
      }
    }
  });
});

// Broadcast the updated user list to all connected clients
function broadcastUserList() {
  const userList = Object.keys(users);
  const message = JSON.stringify({ type: 'user_list', users: userList });
  for (let nickname in users) {
    users[nickname].send(message);
  }
}

server.listen(8080);

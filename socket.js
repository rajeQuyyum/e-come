let ioInstance = null;

function initSocket(server) {
  const { Server } = require("socket.io");
  ioInstance = new Server(server, { cors: { origin: "*" } });
  return ioInstance;
}

function getIO() {
  if (!ioInstance) throw new Error("Socket.io not initialized yet!");
  return ioInstance;
}

module.exports = { initSocket, getIO };

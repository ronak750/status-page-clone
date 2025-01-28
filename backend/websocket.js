const { Server } = require("socket.io");

let io;

module.exports = {
  init: (httpServer) => {
    io = new Server(httpServer, {
      cors: {
        origin: "*", // In production, replace with your actual frontend domain
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      }
    });

    io.on("connection", (socket) => {
      console.log("Client connected:", socket.id);

      // Join organization room when client connects
      socket.on("joinOrg", (orgId) => {
        socket.join(`org_${orgId}`);
        console.log(`Socket ${socket.id} joined org_${orgId}`);
      });

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
      });
    });

    return io;
  },

  getIO: () => {
    if (!io) {
      throw new Error("Socket.io not initialized!");
    }
    return io;
  },

  // Emit updates to all clients in an organization
  emitOrgUpdate: (orgId, eventName, data) => {
    if (!io) {
      throw new Error("Socket.io not initialized!");
    }
    console.log(`Emitting ${eventName} to org_${orgId}:`, data);
    io.to(`org_${orgId}`).emit(eventName, data);
  }
};

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
require("dotenv").config();

const path = require("path");

const servicesRoute = require("./routes/services");
const incidentsRoute = require("./routes/incidents");
const usersRoute = require("./routes/users");
const orgRoute = require("./routes/organizations");
const teamRoute = require("./routes/team");
const publicRoute = require("./routes/public");
const websocket = require("./websocket");

const app = express();
const server = http.createServer(app);

app.use(express.static(path.join(__dirname, "..", "client", "build")));

// Initialize WebSocket
websocket.init(server);

// Middleware
app.use(cors()); // Allow all origins and methods for local testing
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Public routes (no auth required)
app.use("/api/public", publicRoute);

// Protected routes
app.use("/api/services", servicesRoute);
app.use("/api/incidents", incidentsRoute);
app.use("/api/users", usersRoute);
app.use("/api/organizations", orgRoute);
app.use("/api/team", teamRoute);

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "client", "build", "index.html"));
});

const PORT = process.env.PORT || 5050;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

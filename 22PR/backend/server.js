const express = require("express");

const app = express();

const argPort = Number(process.argv[2]);
const port = Number.isInteger(argPort) && argPort > 0 ? argPort : Number(process.env.PORT) || 3000;
const serverId = process.argv[3] || process.env.SERVER_ID || `backend-${port}`;
const startedAt = new Date().toISOString();

app.get("/", (_req, res) => {
  res.json({
    message: "Hello from load balancing demo",
    server: serverId,
    port,
    handledAt: new Date().toISOString(),
    startedAt,
  });
});

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    server: serverId,
    port,
    uptime: Math.round(process.uptime()),
  });
});

app.get("/info", (_req, res) => {
  res.json({
    practice: 22,
    server: serverId,
    routes: ["/", "/health", "/info"],
  });
});

app.listen(port, () => {
  console.log(`${serverId} is running on http://localhost:${port}`);
});

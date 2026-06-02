const express = require("express");
const os = require("os");

const app = express();

const port = Number(process.env.PORT) || 3000;
const serverId = process.env.SERVER_ID || os.hostname();
const startedAt = new Date().toISOString();

app.get("/", (_req, res) => {
  res.json({
    message: "Hello from Docker backend",
    server: serverId,
    hostname: os.hostname(),
    port,
    practice: 23,
    handledAt: new Date().toISOString(),
    startedAt,
  });
});

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    server: serverId,
    hostname: os.hostname(),
    uptime: Math.round(process.uptime()),
  });
});

app.get("/info", (_req, res) => {
  res.json({
    practice: 23,
    server: serverId,
    routes: ["/", "/health", "/info"],
  });
});

app.listen(port, () => {
  console.log(`${serverId} is ready inside container on port ${port}`);
});

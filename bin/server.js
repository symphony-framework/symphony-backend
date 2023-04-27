#!/usr/bin/env node

/**
 * @type {any}
 */

require("dotenv").config();

const http = require('http')
const WebSocket = require('ws')

const SERVER = require("../server.config.js");
const { initRedis } = require("./redis.js"); 

const dashboardRouter = require("../src/routes/dashboard.js");
const roomRouter = require("../src/routes/room.js");
const setDashboardStatus = require('./dashboard_utils/setDashboardStatus.js')
const getContainerIp = require("./aws_utils/getContainerIp.js");

const httpServer = http.createServer();

const wss = new WebSocket.Server({ noServer: true })

const setupWSConnection = require('./utils.js').setupWSConnection

const host = process.env.HOST || 'localhost';
const port = process.env.PORT || 1234;

wss.on('connection', setupWSConnection)

httpServer.on('upgrade', (request, socket, head) => {

  const handleAuth = ws => {
    console.log({connections: wss.clients.size});
    wss.emit('connection', ws, request)
  }
  wss.handleUpgrade(request, socket, head, handleAuth)
})

httpServer.on('request', (req, res) => {
  const {url, method} = req;

  if (url.startsWith("/api")) {
    const restPath = url.split("/api")[1];

    if (restPath === "/dashboard") {
      dashboardRouter(req, res);
      return;
    }

    if (restPath.startsWith("/room")) {
      roomRouter(req, res);
      return;
    }
  }

  if (method === "GET") {
    // healthchecks
    if (url === "/" || url === "/health") {
      res.writeHead(200, {'Content-Type': "text/plain"});
      res.end("okay");
      return;
    };
  } else {
    res.writeHead(401, {"Content-Type": "text/plain"});
    res.end("not found");
  }
})


httpServer.listen(port, host, async() => {
  console.log("final pubsub server v3 - sharded pubsub")

  // save container IP in memory on startup
  SERVER.ip = await getContainerIp();
  // activate dashboard status on startup if active
  await setDashboardStatus();

  console.log("initializing redis");
  await initRedis();
});

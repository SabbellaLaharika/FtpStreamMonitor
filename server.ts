import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";
import { pollingService } from "./src/lib/polling-service";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Start polling service
  pollingService.start();

  io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Send initial snapshot
    socket.emit("fs:snapshot", {
      snapshot: pollingService.getSnapshot()
    });

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  // Listen for polling events and broadcast
  pollingService.on("snapshot", (snapshot) => {
    io.emit("fs:snapshot", { snapshot });
  });

  pollingService.on("diff", (diff) => {
    io.emit("fs:diff", diff);
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});

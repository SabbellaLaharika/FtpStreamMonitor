import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

console.log("Connecting to socket...");

socket.on("connect", () => {
  console.log("Connected! ID:", socket.id);
});

socket.on("fs:snapshot", (data) => {
  console.log("Received snapshot:", JSON.stringify(data, null, 2));
});

socket.on("fs:diff", (data) => {
  console.log("Received diff:", JSON.stringify(data, null, 2));
});

socket.on("disconnect", () => {
  console.log("Disconnected");
});

// Exit after 30 seconds
setTimeout(() => {
  console.log("Test timeout reached");
  process.exit(0);
}, 30000);

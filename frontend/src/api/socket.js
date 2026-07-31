import { io } from "socket.io-client";

let socket = null;

export function getSocket() {
  if (!socket) {
    const token = localStorage.getItem("archivix_token");
    socket = io("/", { auth: { token }, path: "/socket.io" });
  }
  return socket;
}

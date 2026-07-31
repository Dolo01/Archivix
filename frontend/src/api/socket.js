import { io } from "socket.io-client";

let socket = null;

export function getSocket() {
  if (!socket) {
    const token = localStorage.getItem("archivix_token");
    const url = import.meta.env.VITE_API_URL || "/";
    socket = io(url, { auth: { token }, path: "/socket.io" });
  }
  return socket;
}
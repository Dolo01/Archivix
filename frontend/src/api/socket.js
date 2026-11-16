import { io } from "socket.io-client";

let socket = null;
let socketToken = null;

// Connexion temps réel. Recréée si l'utilisateur change (le jeton fait partie de la connexion).
export function getSocket() {
  const token = localStorage.getItem("archivix_token");
  if (socket && socketToken !== token) {
    socket.disconnect();
    socket = null;
  }
  if (!socket) {
    socketToken = token;
    const url = import.meta.env.VITE_API_URL || "/";
    socket = io(url, { auth: { token }, path: "/socket.io" });
  }
  return socket;
}

export function closeSocket() {
  socket?.disconnect();
  socket = null;
  socketToken = null;
}

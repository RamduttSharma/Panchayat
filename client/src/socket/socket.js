import { io } from "socket.io-client";

const URL = "https://panchayat-t2mv.onrender.com";

export const socket = io(URL, {
  transports: ["websocket"], // 🔥 force websocket
});
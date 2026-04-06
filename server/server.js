import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";

dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket setup
const io = new Server(server, {
    cors: {
        origin: "*",
    },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// MongoDB connect
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.log(err));

// File upload (Multer)
const storage = multer.diskStorage({
    destination: "uploads/",
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage });

// Upload route
app.post("/upload", upload.single("file"), (req, res) => {
    res.json({
        fileUrl: `http://localhost:5000/uploads/${req.file.filename}`
    });
});

app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

// Message Model
const messageSchema = new mongoose.Schema({
    text: String,
    sender: String,
    time: String,
    file: String,
}, { timestamps: true });

const Message = mongoose.model("Message", messageSchema);

// SOCKET LOGIC 🔥
let onlineUsers = 0;

io.on("connection", (socket) => {
    console.log("User connected");

    onlineUsers++;
    io.emit("onlineUsers", onlineUsers);

    // Load old messages
    Message.find().sort({ createdAt: 1 }).then(messages => {
        socket.emit("loadMessages", messages);
    });

    // Send message
    socket.on("sendMessage", async (data) => {
        const newMsg = new Message(data);
        await newMsg.save();

        io.emit("receiveMessage", newMsg);
    });

    // Typing
    socket.on("typing", (name) => {
        socket.broadcast.emit("typing", name);
    });

    // Delete message
    socket.on("deleteMessage", async (id) => {
        await Message.findByIdAndDelete(id);
        io.emit("messageDeleted", id);
    });

    // Disconnect
    socket.on("disconnect", () => {
        onlineUsers--;
        io.emit("onlineUsers", onlineUsers);
    });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));
import React, { useEffect, useState, useRef } from "react";
import { socket } from "../socket/socket";
import { getUser } from "../utils/generateUser";

const Chat = () => {
  const inputRef = useRef(null);
  const chatRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState("");
  const [online, setOnline] = useState(0);
  const [file, setFile] = useState(null);
  const [dark, setDark] = useState(localStorage.getItem("theme") === "dark");

  const user = getUser();

  const toggleTheme = () => {
    const newTheme = !dark;
    setDark(newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  useEffect(() => {
    socket.on("loadMessages", setMessages);

    socket.on("receiveMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("typing", (name) => {
      setTyping(name ? name + " is typing..." : "");
      setTimeout(() => setTyping(""), 2000);
    });

    socket.on("onlineUsers", setOnline);

    socket.on("messageDeleted", (id) => {
      setMessages((prev) => prev.filter((m) => m._id !== id));
    });

    return () => socket.off();
  }, []);

  // ✅ SMART AUTO SCROLL (NO JUMP)
  useEffect(() => {
    const el = chatRef.current;
    if (!el) return;

    const isNearBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < 100;

    if (isNearBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  // SEND MESSAGE
  const sendMessage = async () => {
    if (!input.trim() && !file) return;

    let fileUrl = "";

    if (file) {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("https://panchayat-t2mv.onrender.com/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      fileUrl = data.fileUrl;
    }

    socket.emit("sendMessage", {
      text: input,
      sender: user.name,
      senderId: String(user.id),
      time: new Date().toLocaleTimeString(),
      file: fileUrl,
    });

    setInput("");
    setFile(null);

    // ✅ focus without scroll jump
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  const handleTyping = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    } else {
      socket.emit("typing", user.name);
    }
  };

  const deleteMsg = (id) => {
    socket.emit("deleteMessage", id);
  };

  return (
    <div
      style={{
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden", // 🔥 prevent page jump
        background: dark ? "#121212" : "#ECE5DD",
        color: dark ? "white" : "black",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          padding: "10px",
          background: "#075E54",
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <div>
          <h3 style={{ margin: 0 }}>The Panchayat 💬</h3>
          <small>🟢 {online} online</small>
        </div>

        <button onClick={toggleTheme}>
          {dark ? "☀️" : "🌙"}
        </button>
      </div>

      {/* CHAT */}
      <div
        ref={chatRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "10px",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {messages.map((msg) => {
          const isMe =
            String(msg.senderId) === String(user.id) ||
            msg.sender === user.name;

          return (
            <div
              key={msg._id}
              style={{
                display: "flex",
                justifyContent: isMe ? "flex-end" : "flex-start",
                marginBottom: "10px",
              }}
            >
              <div
                style={{
                  background: isMe ? "#DCF8C6" : "#fff",
                  padding: "10px",
                  borderRadius: "10px",
                  maxWidth: "75%",
                }}
              >
                <b>{msg.sender}</b>
                {msg.text && <div>{msg.text}</div>}
              </div>
            </div>
          );
        })}
      </div>

      {/* INPUT */}
      <div
        style={{
          display: "flex",
          padding: "8px",
          background: "#f0f0f0",
          gap: "5px",
          alignItems: "center",
        }}
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleTyping}
          placeholder="Type message..."
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: "20px",
          }}
        />

        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default Chat;
import React, { useEffect, useState } from "react";
import { socket } from "../socket/socket";
import { getUser } from "../utils/generateUser";

const Chat = () => {
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
    socket.on("connect", () => {
      console.log("Connected:", socket.id);
    });

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

  // ❌ OLD SIMPLE SCROLL (same as before)
  useEffect(() => {
    const chatBox = document.getElementById("chatBox");
    if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
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
          flexWrap: "wrap",
          position: "sticky",
          top: 0,
          zIndex: 20,
          boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
        }}
      >
        <div>
          <h3 style={{ margin: 0 }}>The Panchayat 💬</h3>
          <small>🟢 {online} online</small>
        </div>

        <button onClick={toggleTheme} style={{ padding: "5px 10px" }}>
          {dark ? "☀️" : "🌙"}
        </button>
      </div>

      {/* CHAT */}
      <div
        id="chatBox"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "8px",
          background: dark ? "#1E1E1E" : "#ECE5DD",
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
                  background: isMe
                    ? dark
                      ? "#056162"
                      : "#DCF8C6"
                    : dark
                    ? "#2A2A2A"
                    : "#fff",
                  color: dark ? "white" : "black",
                  padding: "10px",
                  borderRadius: "10px",
                  maxWidth: "75%",
                  wordBreak: "break-word",
                  position: "relative",
                }}
              >
                <b style={{ fontSize: "12px" }}>{msg.sender}</b>

                {msg.text && <div>{msg.text}</div>}

                {msg.file && (
                  <img
                    src={msg.file}
                    alt="file"
                    style={{
                      maxWidth: "100%",
                      borderRadius: "8px",
                      marginTop: "5px",
                    }}
                  />
                )}

                <div style={{ fontSize: "10px", marginTop: "5px" }}>
                  {msg.time}
                </div>

                {isMe && (
                  <button
                    onClick={() => deleteMsg(msg._id)}
                    style={{
                      position: "absolute",
                      top: "5px",
                      right: "5px",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    ❌
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* TYPING */}
      <div style={{ fontSize: "12px", paddingLeft: "10px" }}>
        {typing}
      </div>

      {/* INPUT */}
      <div
        style={{
          display: "flex",
          padding: "8px",
          background: dark ? "#2A2A2A" : "#f0f0f0",
          gap: "5px",
          alignItems: "center",
          position: "sticky",
          bottom: 0,
          zIndex: 10,
        }}
      >
        <label
          style={{
            background: "#075E54",
            color: "white",
            padding: "8px",
            borderRadius: "50%",
            cursor: "pointer",
          }}
        >
          📎
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            style={{ display: "none" }}
          />
        </label>

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleTyping}
          placeholder="Type message..."
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: "20px",
            border: "none",
            outline: "none",
          }}
        />

        <button
          onClick={sendMessage}
          style={{
            background: "#075E54",
            color: "white",
            border: "none",
            borderRadius: "50%",
            width: "40px",
            height: "40px",
          }}
        >
          ➤
        </button>
      </div>
    </div>
  );
};

export default Chat;
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

  const user = getUser(); // {id, name}
  
  const toggleTheme = () => {
    const newTheme = !dark;
    setDark(newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected:", socket.id);
    });

    socket.on("loadMessages", (msgs) => {
      setMessages(msgs);
    });

    socket.on("receiveMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("typing", (name) => {
      setTyping(name + " is typing...");
      setTimeout(() => setTyping(""), 2000);
    });

    socket.on("onlineUsers", (count) => {
      setOnline(count);
    });

    socket.on("messageDeleted", (id) => {
      setMessages((prev) => prev.filter((m) => m._id !== id));
    });

    return () => {
      socket.off();
    };
  }, []);

  // Auto scroll
  useEffect(() => {
    const chatBox = document.getElementById("chatBox");
    if (chatBox) {
      chatBox.scrollTop = chatBox.scrollHeight;
    }
  }, [messages]);

  // SEND MESSAGE
  const sendMessage = async () => {
    if (!input.trim() && !file) return;

    let fileUrl = "";

    if (file) {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      fileUrl = data.fileUrl;
    }

    const msgData = {
      text: input,
      sender: user.name,
      senderId: String(user.id),
      time: new Date().toLocaleTimeString(),
      file: fileUrl,
    };

    socket.emit("sendMessage", msgData);

    setInput("");
    setFile(null);
  };

  const handleTyping = () => {
    socket.emit("typing", user.name);
  };

  const deleteMsg = (id) => {
    socket.emit("deleteMessage", id);
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: dark ? "#121212" : "#ECE5DD",
        color: dark ? "white" : "black",
      }}
    >
      {/* HEADER */}
      <div style={{ padding: "10px", background: "#075E54", color: "white" }}>
        <h3>The Panchayat🥰💬</h3>
        <small>🟢 {online} online</small>
        <button onClick={toggleTheme} style={{ padding: "5px 10px" }}>
          {dark ? "☀️ Light" : "🌙 Dark"}
        </button>
      </div>
      {/* CHAT BOX */}
      <div
        id="chatBox"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "10px",
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
                  maxWidth: "60%",
                  position: "relative",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }}
              >
                <b style={{ fontSize: "12px" }}>{msg.sender}</b>

                {msg.text && <div>{msg.text}</div>}

                {msg.file && (
                  <img
                    src={msg.file}
                    alt="file"
                    style={{
                      maxWidth: "150px",
                      marginTop: "5px",
                      borderRadius: "8px",
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
                      fontSize: "10px",
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
      <div className="typing">
        {typing && (
          <span>
            {typing} <span className="dots"></span>
          </span>
        )}
      </div>
      {/* INPUT */}
      <div
        style={{
          display: "flex",
          padding: "10px",
          background: dark ? "#2A2A2A" : "#f0f0f0",
        }}
      >
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleTyping}
          placeholder="Type message..."
          style={{
            flex: 1,
            padding: "10px",
            marginLeft: "5px",
          }}
        />

        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default Chat;

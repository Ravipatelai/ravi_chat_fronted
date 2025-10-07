import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { motion } from "framer-motion";

const socket = io("https://backend-chat-p91t.onrender.com");

export default function RoomChat() {
  const [roomId, setRoomId] = useState("");
  const [joinedRoom, setJoinedRoom] = useState("");
  const [players, setPlayers] = useState([]);
  const [chat, setChat] = useState([]);
  const [message, setMessage] = useState("");
  const [username, setUsername] = useState("");
  const [showRoomId, setShowRoomId] = useState(false);
  const [showPlayers, setShowPlayers] = useState(false);

  const chatEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Scroll to bottom whenever chat changes
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  // Scroll on window resize (keyboard open/close)
  useEffect(() => {
    const handleResize = () => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    socket.on("player-list", (playerList) => setPlayers(playerList));
    socket.on("chat-message", ({ sender, message }) =>
      setChat((prev) => [...prev, { sender, message }])
    );

    return () => {
      socket.off("player-list");
      socket.off("chat-message");
    };
  }, []);

  const createRoom = () => {
    if (!username.trim()) return alert("Enter your name");
    socket.emit("create-room", { name: username }, (res) => {
      setJoinedRoom(res.roomId);
      setRoomId(res.roomId);
    });
  };

  const joinRoom = () => {
    if (!username.trim() || !roomId.trim())
      return alert("Enter name & room ID");
    socket.emit("join-room", { roomId, name: username }, (res) => {
      if (res.success) setJoinedRoom(roomId);
      else alert(res.message);
    });
  };

  const leaveRoom = () => {
    if (!joinedRoom) return;
    socket.emit("leave-room", { roomId: joinedRoom, name: username }, (res) => {
      if (res.success) {
        setJoinedRoom("");
        setPlayers([]);
        setChat([]);
        setRoomId("");
      }
    });
  };

  const sendMessage = () => {
    if (!message.trim() || !joinedRoom) return;
    socket.emit("chat-message", {
      roomId: joinedRoom,
      sender: username,
      message,
    });
    setMessage("");
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="w-full h-[100vh] flex flex-col bg-gray-100">
      {!joinedRoom ? (
        <div className="flex-1 flex flex-col items-center justify-center p-4 w-full text-center">
          <h1 className="text-3xl font-bold text-blue-600 mb-4">
            Ravi Chatting App
          </h1>
          <input
            type="text"
            placeholder="Enter your name"
            className="border p-2 rounded w-full max-w-md mb-4"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
            <button
              onClick={createRoom}
              className="px-4 py-2 bg-green-600 text-white rounded-lg w-full sm:w-auto"
            >
              Create Room
            </button>
            <input
              type="text"
              placeholder="Room ID"
              className="border p-2 rounded flex-1"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
            />
            <button
              onClick={joinRoom}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg w-full sm:w-auto"
            >
              Join Room
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col w-full h-full">
          {/* Header */}
          <div className="p-2 bg-gray-200 flex gap-2">
            <button
              className="px-3 py-1 bg-gray-700 text-white rounded"
              onClick={() => setShowRoomId(!showRoomId)}
            >
              {showRoomId ? "Hide Room ID" : "Show Room ID"}
            </button>
            <button
              className="px-3 py-1 bg-gray-700 text-white rounded"
              onClick={() => setShowPlayers(!showPlayers)}
            >
              {showPlayers ? "Hide Name" : "Show Name"}
            </button>
            <button
              onClick={leaveRoom}
              className="px-3 py-1 bg-red-600 text-white rounded"
            >
              Leave Room
            </button>
          </div>

          {showRoomId && (
            <div className="flex items-center gap-2 p-2 bg-white w-full">
              <div className="bg-gray-200 p-2 rounded flex-1">
                Room ID: {joinedRoom}
              </div>
              <button
                onClick={() => copyToClipboard(joinedRoom)}
                className="px-2 py-1 bg-blue-600 text-white rounded"
              >
                Copy
              </button>
            </div>
          )}

          {showPlayers && (
            <div className="bg-gray-100 p-2 rounded mt-1 w-full">
              <ul className="list-disc pl-6">
                {players.map((p) => (
                  <li key={p.id}>{p.name}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Chat area */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-3 pb-24 bg-gray-50 flex flex-col"
          >
            {chat.map((c, i) => {
              const isMe = c.sender === username;
              return (
                <div
                  key={i}
                  className={`px-2 py-1 rounded-lg max-w-[80%] mb-1 ${
                    isMe
                      ? "bg-blue-500 text-white self-end"
                      : c.sender === "System"
                      ? "bg-gray-300 text-gray-800 self-start italic"
                      : "bg-green-200 text-gray-800 self-start"
                  }`}
                >
                  {c.sender !== "System" && !isMe && <b>{c.sender}: </b>}
                  {c.message}
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-2 bg-white flex gap-2 border-t w-full fixed bottom-0 left-0 right-0">
            <input
              type="text"
              placeholder="Type a message..."
              className="flex-1 border p-2 rounded"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button
              onClick={sendMessage}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

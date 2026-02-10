"use client"
import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Send, User, MessageSquare } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// --- TYPES ---
interface MessageData {
  id: number;
  room: string;
  author: string;
  message: string;
  time: string;
}

// --- CONFIGURATION ---
// Using the integrated Socket.IO API route
const SOCKET_URL = process.env.NODE_ENV === 'production' ? '' : "http://localhost:3000"; 
const SOCKET_PATH = "/api/socket"; 

export default function ChatApp() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("");
  const [isJoined, setIsJoined] = useState<boolean>(false);
  
  // Chat State
  const [currentMessage, setCurrentMessage] = useState<string>("");
  const [messageList, setMessageList] = useState<MessageData[]>([]);

  // Auto-scroll ref
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messageList]);

  // --- SOCKET CONNECTION ---
  const joinChat = () => {
    if (username !== "") {
      // Initialize socket connection to connect to our API route
      fetch('/api/socket');
      
      // 1. Initialize Socket Connection with the correct path
      const socketInstance: Socket = io(SOCKET_URL, {
        path: SOCKET_PATH
      });

      // 2. Setup Listeners
      socketInstance.on("connect", () => {
        setIsConnected(true);
        console.log("Connected to backend:", socketInstance.id);

        
      });

      socketInstance.on("disconnect", () => {
        setIsConnected(false);
      });

      socketInstance.on("sendMessage", (data: MessageData) => {
        console.log("msg", data)
        setMessageList((list) => [...list, data]);
      });

      socketInstance.emit("joinChat", username);

      socketInstance.on('roomNotice', (username)=> {
        console.log(`${username} joined the chat`);
        toast(`${username} joined the chat`, {
          position: "top-right",
          duration: 4000,
          icon: '🌐'
        });
      });

      socketInstance.on('warning', (data: { message: string }) => {
        console.log('Hate speech warning:', data.message);
        toast.error(data.message, {
          position: "top-center",
          duration: 5000,
          style: {
            background: '#fee2e2',
            color: '#991b1b',
            border: '2px solid #dc2626',
            borderRadius: '8px',
            fontWeight: '500',
            padding: '16px'
          },
          icon: '⚠️'
        });
      });

      setSocket(socketInstance);
      setIsJoined(true);
    }
  };

  // --- SEND MESSAGE ---
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentMessage !== "" && socket) {
      const messageData: MessageData = {
        id: Date.now(), // Simple unique ID
        room: "global", // Can be extended for rooms
        author: username,
        message: currentMessage,
        time: new Date(Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      // Emit to Backend
      await socket.emit("sendMessage", messageData);

      // Update UI optimistically (optional, or wait for server)
      setMessageList((list) => [...list, messageData]);
      setCurrentMessage("");
    }
  };

  // --- HANDLE ENTER KEY IN LOGIN ---
  const handleLoginKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      joinChat();
    }
  };

  // --- RENDER: LOGIN SCREEN ---
  if (!isJoined) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0f172a',
              color: '#ffffff',
              padding: '12px 16px',
              borderRadius: '10px',
              boxShadow: '0 6px 18px rgba(2,6,23,0.6)',
              fontWeight: 600,
            },
            success: { icon: '✅' },
            error: {
              style: {
                background: '#fee2e2',
                color: '#7f1d1d',
                border: '1px solid #fca5a5',
              },
            },
          }}
        />
        <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-xl shadow-2xl border border-gray-700">
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <div className="p-3 bg-blue-600 rounded-full">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold">Welcome to Chat</h1>
            <p className="text-gray-400">Enter your name to join the global room</p>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Username..."
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={handleLoginKeyPress}
              />
            </div>
            <button
              onClick={joinChat}
              className="w-full py-3 px-4 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg font-semibold shadow-lg transform transition active:scale-95"
            >
              Join Chat
            </button>
          </div>
          <div className="text-center text-xs text-gray-500 mt-4">
            Connecting to backend at: <span className="font-mono text-yellow-500">{SOCKET_URL}</span>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER: CHAT INTERFACE ---
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#0f172a',
            color: '#ffffff',
            padding: '12px 16px',
            borderRadius: '10px',
            boxShadow: '0 6px 18px rgba(2,6,23,0.6)',
            fontWeight: 600,
          },
          success: { icon: '✅' },
          error: {
            style: {
              background: '#fee2e2',
              color: '#7f1d1d',
              border: '1px solid #fca5a5',
            },
          },
        }}
      />
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white shadow-sm border-b z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
            {username[0].toUpperCase()}
          </div>
          <div>
            <h2 className="font-bold text-gray-800">{username}</h2>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></span>
              <span className="text-xs text-gray-500 font-medium">
                {isConnected ? 'Online' : 'Reconnecting...'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="px-3 py-1 bg-gray-100 rounded-full border border-gray-200">
          <span className="text-xs font-medium text-gray-500">Global Room</span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messageList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
            <MessageSquare className="w-12 h-12 opacity-20" />
            <p>No messages yet. Say hello!</p>
          </div>
        ) : (
          messageList.map((msg, index) => {
            const isMe = msg.author === username;
            return (
              <div
                key={index}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] md:max-w-[60%] rounded-2xl px-4 py-2 shadow-sm ${
                    isMe
                      ? "bg-blue-600 text-white rounded-tr-none"
                      : "bg-white text-gray-800 border border-gray-100 rounded-tl-none"
                  }`}
                >
                  {!isMe && (
                    <p className="text-xs font-bold text-blue-600 mb-1">
                      {msg.author}
                    </p>
                  )}
                  <p className="text-sm leading-relaxed">{msg.message}</p>
                  <p
                    className={`text-[10px] mt-1 text-right ${
                      isMe ? "text-blue-100" : "text-gray-400"
                    }`}
                  >
                    {msg.time}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-200">
        <form onSubmit={sendMessage} className="flex gap-2 max-w-4xl mx-auto">
          <input
            type="text"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 bg-gray-100 text-black border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl outline-none transition"
          />
          <button
            type="submit"
            disabled={!currentMessage.trim()}
            className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md flex items-center justify-center"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
"use client";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { MovingBorder } from "@/components/ui/moving-border";

export default function HomePage() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "👋 Hi! Tell me your PCN details or upload your ticket - I'll create your appeal letter!" }
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");

    // 🔹 Call your backend API here
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: newMessages }),
    });

    const data = await res.json();
    setMessages([...newMessages, { role: "assistant", content: data.reply }]);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* Starry particles background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-black" />
        {/* Realistic stars */}
        <div className="absolute inset-0">
          {[...Array(120)].map((_, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`,
              }}
            >
              <div 
                className="w-1 h-1 bg-white"
                style={{
                  clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                  filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.8))',
                  animation: 'star-pulse ease-in-out infinite',
                }}
              />
            </div>
          ))}
          {/* Bright twinkling stars */}
          {[...Array(50)].map((_, i) => (
            <div
              key={`twinkle-${i}`}
              className="absolute"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 6}s`,
                animationDuration: `${4 + Math.random() * 3}s`,
              }}
            >
              <div 
                className="w-2 h-2 bg-yellow-300"
                style={{
                  clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                  filter: 'drop-shadow(0 0 4px rgba(255,235,59,0.8)) drop-shadow(0 0 8px rgba(255,235,59,0.4))',
                  animation: 'star-twinkle ease-in-out infinite',
                }}
              />
            </div>
          ))}
          {/* Shimmer effect */}
          {[...Array(30)].map((_, i) => (
            <div
              key={`shimmer-${i}`}
              className="absolute w-3 h-3"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 8}s`,
                animationDuration: `${5 + Math.random() * 4}s`,
              }}
            >
              <div 
                className="w-full h-full bg-white"
                style={{
                  clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                  filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.6)) drop-shadow(0 0 12px rgba(255,255,255,0.3))',
                  animation: 'star-shimmer ease-in-out infinite',
                }}
              />
            </div>
          ))}
          {/* Extra small stars for density */}
          {[...Array(80)].map((_, i) => (
            <div
              key={`small-${i}`}
              className="absolute"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 10}s`,
                animationDuration: `${4 + Math.random() * 6}s`,
              }}
            >
              <div 
                className="w-0.5 h-0.5 bg-white"
                style={{
                  clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                  filter: 'drop-shadow(0 0 1px rgba(255,255,255,0.6))',
                  animation: 'star-pulse ease-in-out infinite',
                }}
              />
            </div>
          ))}
          {/* Night sky twinkly stars */}
          {[...Array(40)].map((_, i) => (
            <div
              key={`night-twinkle-${i}`}
              className="absolute"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 12}s`,
                animationDuration: `${2 + Math.random() * 4}s`,
              }}
            >
              <div 
                className="w-1.5 h-1.5 bg-white"
                style={{
                  clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                  filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.8))',
                  animation: 'night-sky-twinkle ease-in-out infinite',
                }}
              />
            </div>
          ))}
          {/* Sparkle twinkly stars */}
          {[...Array(25)].map((_, i) => (
            <div
              key={`sparkle-${i}`}
              className="absolute"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 15}s`,
                animationDuration: `${1.5 + Math.random() * 2.5}s`,
              }}
            >
              <div 
                className="w-2 h-2 bg-yellow-200"
                style={{
                  clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                  filter: 'drop-shadow(0 0 3px rgba(255,255,224,0.9)) drop-shadow(0 0 6px rgba(255,255,224,0.6))',
                  animation: 'sparkle-twinkle ease-in-out infinite',
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Full-screen background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-10"
        style={{
          backgroundImage: 'url(/heroaiticket.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/40 z-20" />
      
      {/* Content */}
      <div className="relative z-30 flex flex-col items-center justify-center min-h-screen px-4 py-8">
        {/* Hero / Landing Headline */}
        <div className="text-center max-w-4xl mb-8 sm:mb-12">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
            Meet Glo!
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed">
            Your revolutionary AI-powered PCN appeal buddy
          </p>
        </div>

        {/* Chat UI Section with Moving Border */}
        <MovingBorder
          borderRadius="1rem"
          className="w-full max-w-4xl h-auto"
        >
          <div className="flex flex-col bg-zinc-900/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto" style={{ height: '400px' }}>
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`mb-4 ${m.role === "user" ? "text-right" : "text-left"}`}
                >
                  <div
                    className={`inline-block max-w-xs sm:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl text-sm sm:text-base ${
                      m.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-zinc-700/80 text-gray-100"
                    }`}
                  >
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <div className="p-4 sm:p-6 border-t border-zinc-700/50 flex bg-zinc-950/90 backdrop-blur-sm">
              <input
                className="flex-1 bg-zinc-800/80 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tell me your PCN details or upload your ticket..."
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button
                onClick={sendMessage}
                className="ml-3 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-medium text-sm sm:text-base transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </MovingBorder>
      </div>
    </div>
  );
}
"use client";
import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { MovingBorder } from "./ui/moving-border";

export default function Hero() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "👋 Hi! Tell me your PCN details or upload your ticket - I'll create your appeal letter!" }
  ]);
  const [input, setInput] = useState("");
  const [isLocked, setIsLocked] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const handleChatClick = () => {
    if (!isLocked) {
      setIsLocked(true);
      // Scroll to waitlist section with a small delay to ensure DOM is updated
      setTimeout(() => {
        const waitlistForm = document.querySelector('[data-waitlist-form]');
        if (waitlistForm) {
          waitlistForm.scrollIntoView({ 
            behavior: 'smooth',
            block: 'center'
          });
        } else {
          // Fallback: try to find the waitlist section
          const waitlistSection = document.querySelector('[data-section="waitlist"]');
          if (waitlistSection) {
            waitlistSection.scrollIntoView({ 
              behavior: 'smooth',
              block: 'start'
            });
          } else {
            console.warn('Waitlist form not found');
          }
        }
      }, 100);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLocked) return;

    const newMessage = { role: "user", content: input };
    setMessages(prev => [...prev, newMessage]);
    setInput("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, newMessage] }),
      });

      const data = await response.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch (error) {
      console.error("Error:", error);
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I'm having trouble right now. Please try again!" }]);
    }
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
          {[...Array(120)].map((_, i) => {
            // Use deterministic positioning based on index
            const left = ((i * 7.3) % 100).toFixed(2);
            const top = ((i * 11.7) % 100).toFixed(2);
            const delay = ((i * 0.1) % 5).toFixed(2);
            const duration = (3 + (i * 0.03) % 4).toFixed(2);
            
            return (
              <div
                key={i}
                className="absolute"
                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                  animationDelay: `${delay}s`,
                  animationDuration: `${duration}s`,
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
            );
          })}
          {/* Bright twinkling stars */}
          {[...Array(50)].map((_, i) => {
            const left = (((i + 120) * 13.7) % 100).toFixed(2);
            const top = (((i + 120) * 19.3) % 100).toFixed(2);
            const delay = (((i + 120) * 0.15) % 6).toFixed(2);
            const duration = (4 + ((i + 120) * 0.05) % 3).toFixed(2);
            
            return (
              <div
                key={`twinkle-${i}`}
                className="absolute"
                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                  animationDelay: `${delay}s`,
                  animationDuration: `${duration}s`,
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
            );
          })}
          {/* Shimmer effect */}
          {[...Array(30)].map((_, i) => {
            const left = (((i + 170) * 23.1) % 100).toFixed(2);
            const top = (((i + 170) * 17.9) % 100).toFixed(2);
            const delay = (((i + 170) * 0.2) % 8).toFixed(2);
            const duration = (5 + ((i + 170) * 0.07) % 4).toFixed(2);
            
            return (
              <div
                key={`shimmer-${i}`}
                className="absolute w-3 h-3"
                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                  animationDelay: `${delay}s`,
                  animationDuration: `${duration}s`,
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
            );
          })}
          {/* Extra small stars for density */}
          {[...Array(80)].map((_, i) => {
            const left = (((i + 200) * 31.7) % 100).toFixed(2);
            const top = (((i + 200) * 29.1) % 100).toFixed(2);
            const delay = (((i + 200) * 0.12) % 10).toFixed(2);
            const duration = (4 + ((i + 200) * 0.08) % 6).toFixed(2);
            
            return (
              <div
                key={`small-${i}`}
                className="absolute"
                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                  animationDelay: `${delay}s`,
                  animationDuration: `${duration}s`,
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
            );
          })}
          {/* Night sky twinkly stars */}
          {[...Array(40)].map((_, i) => {
            const left = (((i + 280) * 37.3) % 100).toFixed(2);
            const top = (((i + 280) * 41.7) % 100).toFixed(2);
            const delay = (((i + 280) * 0.18) % 12).toFixed(2);
            const duration = (2 + ((i + 280) * 0.06) % 4).toFixed(2);
            
            return (
              <div
                key={`night-twinkle-${i}`}
                className="absolute"
                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                  animationDelay: `${delay}s`,
                  animationDuration: `${duration}s`,
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
            );
          })}
          {/* Sparkle twinkly stars */}
          {[...Array(25)].map((_, i) => {
            const left = (((i + 320) * 43.9) % 100).toFixed(2);
            const top = (((i + 320) * 47.1) % 100).toFixed(2);
            const delay = (((i + 320) * 0.25) % 15).toFixed(2);
            const duration = (1.5 + ((i + 320) * 0.04) % 2.5).toFixed(2);
            
            return (
              <div
                key={`sparkle-${i}`}
                className="absolute"
                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                  animationDelay: `${delay}s`,
                  animationDuration: `${duration}s`,
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
            );
          })}
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
      
      {/* Gradient fade-out at bottom */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-32 z-25"
        style={{
          background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.3) 30%, rgba(0,0,0,0.7) 70%, rgba(0,0,0,1) 100%)'
        }}
      />
      
      {/* Content */}
      <div className="relative z-30 flex flex-col items-center justify-center min-h-screen px-4 py-8">
        {/* Hero / Landing Headline */}
        <div className="text-center max-w-4xl mb-8 sm:mb-12">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
            Meet Kerbi!
          </h1>
          <p className="text-xl sm:text-2xl font-bold text-white mb-8 sm:mb-12 max-w-3xl mx-auto leading-tight">
            Your revolutionary AI-powered PCN appeal buddy
          </p>
        </div>

        {/* Chat UI Section with Moving Border */}
        <MovingBorder
          borderRadius="1rem"
          className="w-full max-w-4xl h-auto"
        >
          <div 
            className={`flex flex-col bg-zinc-900/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
              isLocked ? 'opacity-60 cursor-pointer' : ''
            }`}
            onClick={handleChatClick}
          >
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
                className={`flex-1 bg-zinc-800/80 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base ${
                  isLocked ? 'cursor-not-allowed opacity-50' : ''
                }`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isLocked ? "Chat locked - Join waitlist below!" : "Tell me your PCN details or upload your ticket..."}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                disabled={isLocked}
              />
              <button
                onClick={sendMessage}
                disabled={isLocked}
                className={`ml-3 px-6 py-3 rounded-xl text-white font-medium text-sm sm:text-base transition-colors ${
                  isLocked 
                    ? 'bg-zinc-600 cursor-not-allowed opacity-50' 
                    : 'bg-blue-600 hover:bg-blue-500'
                }`}
              >
                {isLocked ? 'Locked' : 'Send'}
              </button>
            </div>
            
            {/* Lock overlay when locked */}
            {isLocked && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                <div className="text-center">
                  <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center border-2 border-zinc-600 mx-auto mb-4">
                    <svg 
                      className="w-8 h-8 text-zinc-400" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
                      />
                    </svg>
                  </div>
                  <p className="text-white text-lg font-semibold mb-2">Chat Locked</p>
                  <p className="text-gray-300 text-sm">Join the waitlist to unlock full access!</p>
                </div>
              </div>
            )}
          </div>
        </MovingBorder>
      </div>
    </div>
  );
}

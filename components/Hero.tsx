'use client';
import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { MovingBorder } from "./ui/moving-border";
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '../lib/auth';
import UsageStats from './UsageStats';
import ImageUpload from './ImageUpload';
import PaymentForm from './PaymentForm';

export default function Hero() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "🔍 **Welcome to Kerbi - Your AI PCN Compliance Expert!**\n\nI specialize in finding **legal loopholes and compliance issues** in PCN cases that can get your ticket cancelled.\n\n**Upload your ticket or describe your situation** - I'll analyze it for:\n✅ **Signage compliance issues**\n✅ **Procedural errors**\n✅ **Legal technicalities**\n✅ **Mitigating circumstances**\n\n*No account needed for analysis - I'll show you what I found first!*" }
  ]);
  const [input, setInput] = useState("");
  const [user, setUser] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [detectedVehicle, setDetectedVehicle] = useState<string | null>(null);
  const [needsVehiclePayment, setNeedsVehiclePayment] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [currentAppealId, setCurrentAppealId] = useState<string | null>(null);
  const [paymentType, setPaymentType] = useState<'additional_appeal' | 'vehicle_addition'>('additional_appeal');
  const [hasGeneratedAppeal, setHasGeneratedAppeal] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        fetchUsage(currentUser.id);
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const fetchUsage = async (userId: string) => {
    try {
      const response = await fetch(`/api/check-usage?userId=${userId}`);
      const data = await response.json();
      setUsage(data);
    } catch (error) {
      console.error('Failed to fetch usage:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessage = { role: "user", content: input };
    setMessages(prev => [...prev, newMessage]);
    setInput("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: [...messages, newMessage],
          isAnonymous: !user,
          userId: user?.id || null,
          userContext: user ? `User: ${user.email}, Vehicle: ${usage?.vehicleReg || 'Not set'}` : 'Anonymous user'
        }),
      });

      const data = await response.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
      
      // Handle different response types
      if (data.showAnalysis) {
        setShowAnalysis(true);
        setAnalysisData(data);
      }
      
      if (data.requiresPayment) {
        setShowPaywall(true);
      }
      
      if (!user && data.requiresAuth) {
        setShowAuthPrompt(true);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I'm having trouble right now. Please try again!" }]);
    }
  };

  const handleImageProcessed = async (data: any) => {
    // For anonymous users, show auth prompt immediately
    if (!user) {
      setShowAuthPrompt(true);
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "🚨 **Authentication Required**\n\nI can see your ticket details! To create your professional appeal letter, you'll need to create a free account first.\n\n**Why create an account?**\n✅ Get your first appeal FREE\n✅ Save and track your appeals\n✅ Get more free appeals each month\n✅ Access your appeal history\n\n**Ready to get started?**" 
      }]);
      return;
    }

    const { extractedData, fullText } = data;
    
    if (extractedData.numberPlate) {
      setDetectedVehicle(extractedData.numberPlate);
      
      // Check if this is a different vehicle than registered
      if (usage?.vehicleReg && extractedData.numberPlate.toUpperCase() !== usage.vehicleReg.toUpperCase()) {
        setNeedsVehiclePayment(true);
        setPaymentType('vehicle_addition');
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: `I detected vehicle ${extractedData.numberPlate} in your image. This is different from your registered vehicle (${usage.vehicleReg}). You'll need to add this vehicle to your account for £3.` 
        }]);
        return;
      }
    }

    // Create appeal with detected data
    const appealContent = `PCN Details extracted from image:
- Number Plate: ${extractedData.numberPlate || 'Not detected'}
- PCN Number: ${extractedData.pcnNumber || 'Not detected'}
- Amount: ${extractedData.amount || 'Not detected'}
- Date: ${extractedData.date || 'Not detected'}
- Location: ${extractedData.location || 'Not detected'}

${fullText}`;

    setMessages(prev => [...prev, { 
      role: "assistant", 
      content: `I've extracted the details from your PCN ticket. Now I'll create your appeal letter based on this information.` 
    }]);

    await createAppeal(appealContent, extractedData.numberPlate, extractedData.amount);
  };

  const createAppeal = async (appealContent: string, numberPlate: string, ticketValue: number = 0) => {
    if (!user) return;

    const isFreeAppeal = usage?.hasFreeAppeal;
    
    if (!isFreeAppeal) {
      setShowPayment(true);
      setPaymentType('additional_appeal');
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: `You've used your free appeal for this month. To create this appeal, please pay £5.` 
      }]);
      return;
    }

    try {
      const response = await fetch('/api/create-appeal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          appealContent,
          numberPlate: numberPlate || detectedVehicle,
          ticketValue: ticketValue * 100, // Convert to pence
          isFreeAppeal: true,
          imageUrl: null // Will be set if image was uploaded
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setCurrentAppealId(data.appealId);
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: `✅ Appeal created successfully! Your appeal has been saved to your dashboard. You can track its progress there.` 
        }]);
        fetchUsage(user.id); // Refresh usage stats
      }
    } catch (error) {
      console.error('Failed to create appeal:', error);
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: `❌ Failed to create appeal. Please try again.` 
      }]);
    }
  };

  const handlePaymentSuccess = async () => {
    setShowPayment(false);
    
    if (paymentType === 'vehicle_addition' && detectedVehicle) {
      // Update vehicle registration
      try {
        const response = await fetch('/api/vehicles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            vehicleReg: detectedVehicle
          }),
        });

        if (response.ok) {
          setNeedsVehiclePayment(false);
          setMessages(prev => [...prev, { 
            role: "assistant", 
            content: `✅ Vehicle ${detectedVehicle} added to your account! Now I can create your appeal.` 
          }]);
          fetchUsage(user.id);
        }
      } catch (error) {
        console.error('Failed to update vehicle:', error);
      }
    } else if (paymentType === 'additional_appeal') {
      // Create paid appeal
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.role === 'user') {
        await createAppeal(lastMessage.content, detectedVehicle || usage?.vehicleReg);
      }
    }
  };

  const handlePaymentError = (error: string) => {
    setMessages(prev => [...prev, { 
      role: "assistant", 
      content: `❌ Payment failed: ${error}. Please try again.` 
    }]);
  };

  const handleSignOut = async () => {
    const { signOut } = await import('../lib/auth');
    await signOut();
    router.push('/auth');
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

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
        {/* Header with user info */}
        {user && (
          <div className="w-full max-w-4xl mb-4 flex justify-between items-center">
            <div className="text-sm text-gray-400">
              Welcome, {user.email}
            </div>
            <button
              onClick={handleSignOut}
              className="text-sm text-gray-400 hover:text-white"
            >
              Sign Out
            </button>
          </div>
        )}

        {/* Hero / Landing Headline */}
        <div className="text-center max-w-4xl mb-8 sm:mb-12">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
            Find the Loophole!
          </h1>
          <p className="text-xl sm:text-2xl font-bold text-white mb-8 sm:mb-12 max-w-3xl mx-auto leading-tight">
            AI-powered compliance expert finds legal technicalities to cancel your PCN
          </p>
        </div>

        {/* Usage Stats */}
        {user && usage && <UsageStats userId={user.id} />}

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

            {/* Image Upload */}
            <div className="px-4 sm:px-6 py-2">
              <ImageUpload 
                onImageProcessed={handleImageProcessed}
                disabled={showPayment || needsVehiclePayment}
              />
            </div>

            {/* Analysis Results */}
            {showAnalysis && (
              <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-500/30 rounded-xl">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-green-400 mb-2">🎯 Analysis Complete!</h3>
                  <p className="text-gray-300 mb-4">
                    I found strong compliance issues in your case. Ready to get your winning appeal letter?
                  </p>
                  <div className="flex justify-center">
                    {!user ? (
                      <button
                        onClick={() => router.push('/signup')}
                        className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                      >
                        Get My Appeal Letter - FREE
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowPaywall(true)}
                        className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                      >
                        Get My Appeal Letter - £5
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {!user ? "* First appeal free with account" : "* Professional appeal letter included"}
                  </p>
                </div>
              </div>
            )}

            {/* Paywall */}
            {showPaywall && (
              <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-500/30 rounded-xl">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-yellow-400 mb-2">💰 Get Your Winning Appeal Letter</h3>
                  <p className="text-gray-300 mb-4">
                    I've found strong compliance issues - now let me create your professional appeal letter!
                  </p>
                  
                  <div className="bg-zinc-800/50 rounded-lg p-4 mb-4 text-left">
                    <h4 className="font-semibold text-white mb-2">🎯 What you'll get:</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>✅ Professional appeal letter tailored to your compliance issues</li>
                      <li>✅ Legal arguments based on the technicalities I found</li>
                      <li>✅ Step-by-step submission guide</li>
                      <li>✅ Evidence checklist to strengthen your case</li>
                      <li>✅ Success tracking in your dashboard</li>
                    </ul>
                  </div>
                  
                  <div className="flex justify-center">
                    <button
                      onClick={() => {
                        // Handle payment flow
                        setShowPayment(true);
                        setPaymentType('additional_appeal');
                      }}
                      className="bg-yellow-600 hover:bg-yellow-500 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                    >
                      Get My Appeal Letter - £5
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    * Less than the cost of your PCN - and you could get it completely cancelled!
                  </p>
                </div>
              </div>
            )}

            {/* Authentication Prompt */}
            {showAuthPrompt && !user && (
              <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-xl">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-white mb-2">🔐 Create Your Free Account</h3>
                  <p className="text-gray-300 mb-4">
                    Get your first appeal FREE and save it to your dashboard. Plus, unlock more free appeals each month!
                  </p>
                  <div className="flex justify-center">
                    <button
                      onClick={() => router.push('/signup')}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                    >
                      Create Free Account
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    * Account required to generate appeals
                  </p>
                </div>
              </div>
            )}

            {/* Payment Form */}
            {showPayment && (
              <div className="px-4 sm:px-6 py-2">
                <PaymentForm
                  appealId={currentAppealId || ''}
                  userId={user.id}
                  paymentType={paymentType}
                  onPaymentSuccess={handlePaymentSuccess}
                  onPaymentError={handlePaymentError}
                />
              </div>
            )}

            {/* Input */}
            <div className="p-4 sm:p-6 border-t border-zinc-700/50 flex bg-zinc-950/90 backdrop-blur-sm">
              <input
                className="flex-1 bg-zinc-800/80 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={user ? "Tell me your PCN details or upload your ticket..." : "Describe your parking situation - I'll analyze it for compliance issues!"}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                disabled={showPayment || needsVehiclePayment}
              />
              <button
                onClick={sendMessage}
                disabled={showPayment || needsVehiclePayment}
                className={`ml-3 px-6 py-3 rounded-xl text-white font-medium text-sm sm:text-base transition-colors ${
                  showPayment || needsVehiclePayment
                    ? 'bg-zinc-600 cursor-not-allowed opacity-50' 
                    : 'bg-blue-600 hover:bg-blue-500'
                }`}
              >
                {user ? 'Send' : 'Analyze My Case'}
              </button>
            </div>
          </div>
        </MovingBorder>
      </div>
    </div>
  );
}
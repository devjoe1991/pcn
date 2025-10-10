'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CustomSignupForm } from './CustomSignupForm';
import { CustomLoginForm } from './CustomLoginForm';

interface PendingAppeal {
  content: string;
  numberPlate: string;
  ticketValue: number;
}

export default function JoinKerbi() {
  const [isLogin, setIsLogin] = useState(false);
  const [pendingAppeal, setPendingAppeal] = useState<PendingAppeal | null>(null);
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Check for pending appeal data in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const appealData = urlParams.get('appeal');
    if (appealData) {
      try {
        setPendingAppeal(JSON.parse(decodeURIComponent(appealData)));
      } catch (error) {
        console.error('Error parsing appeal data:', error);
      }
    }
  }, []);

  const handleAuthSuccess = () => {
    if (pendingAppeal) {
      setMessage('Your appeal has been saved to your dashboard!');
    }
    router.push('/dashboard');
  };

  return (
    <section className="bg-black py-16 sm:py-20" data-section="join-kerbi">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
            Join Kerbi - Appeal Your PCN
          </h2>
          <p className="text-xl sm:text-2xl font-bold text-white max-w-3xl mx-auto leading-tight mb-8">
            Get your PCN cancelled with AI-powered compliance analysis
          </p>
          
          {/* Compliance Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-700">
              <div className="text-3xl font-bold text-green-400 mb-2">73%</div>
              <div className="text-gray-300">Success Rate</div>
              <div className="text-sm text-gray-400">of appeals won</div>
            </div>
            <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-700">
              <div className="text-3xl font-bold text-blue-400 mb-2">£2.3M</div>
              <div className="text-gray-300">Saved</div>
              <div className="text-sm text-gray-400">for our users</div>
            </div>
            <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-700">
              <div className="text-3xl font-bold text-yellow-400 mb-2">15sec</div>
              <div className="text-gray-300">Average Time</div>
              <div className="text-sm text-gray-400">to create appeal</div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row items-center justify-center gap-12">
          {/* Left Side - Compliance Content */}
          <div className="flex-1 max-w-2xl">
            <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-700">
              <h3 className="text-2xl font-bold text-white mb-6">Why Kerbi Works</h3>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2">AI Compliance Analysis</h4>
                    <p className="text-gray-300">Our AI finds legal loopholes and procedural errors that councils miss, giving you the best chance of success.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2">Professional Appeal Letters</h4>
                    <p className="text-gray-300">Get professionally written appeal letters tailored to your specific case and compliance issues found.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2">Quick & Easy</h4>
                    <p className="text-gray-300">Upload your PCN or describe your situation - we&apos;ll handle the rest. Get your appeal letter in minutes.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2">Track Your Progress</h4>
                    <p className="text-gray-300">Monitor your appeal status, access your appeal history, and get updates on your case progress.</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                <h4 className="text-green-400 font-semibold mb-2">🎯 First Appeal FREE</h4>
                <p className="text-green-300 text-sm">Get your first appeal letter completely free. No hidden fees, no subscription required.</p>
              </div>
            </div>
          </div>

          {/* Right Side - Auth Component */}
          <div className="flex-1 max-w-md w-full">
            <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-700">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">
                  {isLogin ? 'Welcome Back' : 'Join Kerbi'}
                </h3>
                <p className="text-gray-400">
                  {isLogin ? 'Sign in to your account' : 'Get your first appeal FREE'}
                </p>
              </div>
              
              {pendingAppeal && (
                <div className="mb-6 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                  <h4 className="text-green-400 font-semibold mb-2">🎉 Your appeal is ready!</h4>
                  <p className="text-green-300 text-sm">
                    {isLogin ? 'Sign in to save your generated appeal.' : 'Create an account to save your generated appeal.'}
                  </p>
                </div>
              )}

              {isLogin ? (
                <CustomLoginForm 
                  pendingAppeal={pendingAppeal}
                  onSuccess={handleAuthSuccess}
                />
              ) : (
                <CustomSignupForm 
                  pendingAppeal={pendingAppeal}
                  onSuccess={handleAuthSuccess}
                />
              )}

              {message && (
                <div className={`mt-4 p-3 rounded-lg text-sm ${
                  message.includes('saved') ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                }`}>
                  {message}
                </div>
              )}

              <div className="mt-6 text-center">
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

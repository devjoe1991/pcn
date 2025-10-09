'use client';
import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';

export default function JoinKerbi() {
  const [isLogin, setIsLogin] = useState(false);
  const [pendingAppeal, setPendingAppeal] = useState<any>(null);
  const [message, setMessage] = useState('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();

  const handleAuthSuccess = async (session: any) => {
    if (pendingAppeal) {
      try {
        const response = await fetch('/api/save-anonymous-appeal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: session.user.id,
            appealContent: pendingAppeal.content,
            numberPlate: pendingAppeal.numberPlate,
            ticketValue: pendingAppeal.ticketValue
          }),
        });

        if (response.ok) {
          setMessage('Your appeal has been saved to your dashboard!');
        }
      } catch (error) {
        console.error('Error saving appeal:', error);
      }
    }
    router.push('/');
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
                    <p className="text-gray-300">Upload your PCN or describe your situation - we'll handle the rest. Get your appeal letter in minutes.</p>
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

              <Auth
                supabaseClient={supabase}
                view={isLogin ? "sign_in" : "sign_up"}
                appearance={{
                  theme: ThemeSupa,
                  variables: {
                    default: {
                      colors: {
                        brand: '#3b82f6',
                        brandAccent: '#2563eb',
                        brandButtonText: 'white',
                        defaultButtonBackground: '#27272a',
                        defaultButtonBackgroundHover: '#3f3f46',
                        defaultButtonBorder: '#52525b',
                        defaultButtonText: 'white',
                        dividerBackground: '#52525b',
                        inputBackground: '#27272a',
                        inputBorder: '#52525b',
                        inputBorderHover: '#71717a',
                        inputBorderFocus: '#3b82f6',
                        inputText: 'white',
                        inputLabelText: '#a1a1aa',
                        inputPlaceholder: '#71717a',
                        messageText: '#a1a1aa',
                        messageTextDanger: '#ef4444',
                        anchorTextColor: '#3b82f6',
                        anchorTextHoverColor: '#2563eb',
                      },
                      space: {
                        spaceSmall: '4px',
                        spaceMedium: '8px',
                        spaceLarge: '16px',
                        labelBottomMargin: '8px',
                        anchorBottomMargin: '4px',
                        emailInputSpacing: '4px',
                        socialAuthSpacing: '4px',
                        buttonPadding: '10px 15px',
                        inputPadding: '10px 15px',
                      },
                      fontSizes: {
                        baseBodySize: '13px',
                        baseInputSize: '14px',
                        baseLabelSize: '14px',
                        baseButtonSize: '14px',
                      },
                      fonts: {
                        bodyFontFamily: `ui-sans-serif, system-ui, -apple-system, sans-serif`,
                        buttonFontFamily: `ui-sans-serif, system-ui, -apple-system, sans-serif`,
                        inputFontFamily: `ui-sans-serif, system-ui, -apple-system, sans-serif`,
                        labelFontFamily: `ui-sans-serif, system-ui, -apple-system, sans-serif`,
                      },
                      borderWidths: {
                        buttonBorderWidth: '1px',
                        inputBorderWidth: '1px',
                      },
                      radii: {
                        borderRadiusButton: '6px',
                        buttonBorderRadius: '6px',
                        inputBorderRadius: '6px',
                      },
                    },
                  },
                }}
                providers={[]}
                redirectTo={`${window.location.origin}/`}
              />

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

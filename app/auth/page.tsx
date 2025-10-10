'use client';
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, useSearchParams } from 'next/navigation';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';

interface PendingAppeal {
  content: string;
  numberPlate: string;
  ticketValue: number;
}

export default function AuthPage() {
  const [pendingAppeal, setPendingAppeal] = useState<PendingAppeal | null>(null);
  const [message, setMessage] = useState('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check for pending appeal data in URL params
    const appealData = searchParams.get('appeal');
    if (appealData) {
      try {
        setPendingAppeal(JSON.parse(decodeURIComponent(appealData)));
      } catch (error) {
        console.error('Error parsing appeal data:', error);
      }
    }

    // Check for confirmation messages
    const message = searchParams.get('message');
    const error = searchParams.get('error');

    if (message) {
      switch (message) {
        case 'email-confirmed':
          setMessage('🎉 Email confirmed successfully! You can now sign in to your account.');
          break;
        case 'password-reset':
          setMessage('🔑 Password reset link confirmed. You can now set a new password.');
          break;
        case 'email-changed':
          setMessage('📧 Email change confirmed. Your new email address is now active.');
          break;
        case 'confirmed':
          setMessage('✅ Confirmation successful! You can now proceed.');
          break;
        default:
          setMessage('✅ ' + message);
      }
    }

    if (error) {
      switch (error) {
        case 'missing-parameters':
          setMessage('❌ Missing confirmation parameters. Please try again.');
          break;
        case 'invalid-token':
          setMessage('❌ Invalid or expired confirmation link. Please request a new one.');
          break;
        case 'user-not-found':
          setMessage('❌ User not found. Please try signing up again.');
          break;
        case 'confirmation-failed':
          setMessage('❌ Confirmation failed. Please try again.');
          break;
        default:
          setMessage('❌ ' + error);
      }
    }

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // If there's a pending appeal, save it
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
        router.push('/dashboard');
      }
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, [supabase, router, searchParams, pendingAppeal]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-zinc-900 rounded-lg p-8 border border-zinc-700">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Welcome to Kerbi</h1>
            <p className="text-gray-400">Create your account to get started</p>
          </div>
          
          {pendingAppeal && (
            <div className="mb-6 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
              <h3 className="text-green-400 font-semibold mb-2">🎉 Your appeal is ready!</h3>
              <p className="text-green-300 text-sm">
                Create an account to save your generated appeal and track its progress.
              </p>
            </div>
          )}

          <Auth
            supabaseClient={supabase}
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
            redirectTo={`${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard`}
          />

          {message && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${
              message.includes('saved') ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
            }`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
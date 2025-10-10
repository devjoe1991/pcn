'use client';
import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface PendingAppeal {
  content: string;
  numberPlate: string;
  ticketValue: number;
}

interface CustomLoginFormProps {
  onSuccess?: () => void;
  pendingAppeal?: PendingAppeal;
}

export function CustomLoginForm({ onSuccess, pendingAppeal }: CustomLoginFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        // Handle specific error messages
        if (error.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please check your credentials and try again.');
        } else if (error.message.includes('Email not confirmed')) {
          setError('Please check your email and click the confirmation link before signing in.');
        } else if (error.message.includes('Too many requests')) {
          setError('Too many login attempts. Please wait a few minutes before trying again.');
        } else {
          setError(error.message);
        }
      } else if (data.user) {
        setSuccess('Successfully signed in!');
        
        // If there's a pending appeal, save it
        if (pendingAppeal) {
          try {
            const response = await fetch('/api/save-anonymous-appeal', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: data.user.id,
                appealContent: pendingAppeal.content,
                numberPlate: pendingAppeal.numberPlate,
                ticketValue: pendingAppeal.ticketValue
              }),
            });

            if (response.ok) {
              setSuccess('Signed in and appeal saved to your dashboard!');
            }
          } catch (appealError) {
            console.error('Error saving appeal:', appealError);
          }
        }

        // Redirect to dashboard
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);

        if (onSuccess) {
          onSuccess();
        }
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setError('Please enter your email address first');
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/auth?message=password-reset&type=recovery`,
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess('Password reset email sent! Check your inbox for instructions.');
      }
    } catch {
      setError('Failed to send password reset email. Please try again.');
    }
  };

  return (
    <Card className="w-full max-w-md bg-zinc-900 border-zinc-700">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-white text-center">
          Welcome Back
        </CardTitle>
        <CardDescription className="text-gray-400 text-center">
          Sign in to your Appeal Your PCN account
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {pendingAppeal && (
          <div className="mb-6 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
            <h3 className="text-green-400 font-semibold mb-2 flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Your appeal is ready!
            </h3>
            <p className="text-green-300 text-sm">
              Sign in to save your generated appeal and track its progress.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter your email"
              className="bg-zinc-800 border-zinc-600 text-white placeholder-gray-400"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <PasswordInput
              id="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Enter your password"
              className="bg-zinc-800 border-zinc-600 text-white placeholder-gray-400"
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
              required
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              Forgot your password?
            </button>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Signing In...
              </div>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
            <div className="flex items-center text-red-400">
              <AlertCircle className="h-4 w-4 mr-2" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="mt-4 p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
            <div className="flex items-center text-green-400">
              <CheckCircle className="h-4 w-4 mr-2" />
              <span className="text-sm">{success}</span>
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            Don&apos;t have an account?{' '}
            <button
              onClick={() => router.push('/signup')}
              className="text-blue-400 hover:text-blue-300 font-medium"
            >
              Create one
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

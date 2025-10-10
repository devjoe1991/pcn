'use client';
import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { validatePassword, isPasswordValid, getPasswordStrength, getPasswordStrengthColor, getPasswordStrengthText } from '@/lib/password-validation';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface PendingAppeal {
  content: string;
  numberPlate: string;
  ticketValue: number;
}

interface CustomSignupFormProps {
  onSuccess?: () => void;
  pendingAppeal?: PendingAppeal;
}

export function CustomSignupForm({ onSuccess, pendingAppeal }: CustomSignupFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();

  const passwordRequirements = validatePassword(formData.password);
  const isPasswordComplete = isPasswordValid(passwordRequirements);
  const passwordStrength = getPasswordStrength(passwordRequirements);
  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.email || !formData.password || !formData.fullName) {
      setError('Please fill in all fields');
      return;
    }

    if (!isPasswordComplete) {
      setError('Password does not meet security requirements');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          }
        }
      });

      if (error) {
        setError(error.message);
      } else if (data.user) {
        setSuccess('Account created successfully! Please check your email to confirm your account.');
        
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
              setSuccess('Account created and appeal saved! Please check your email to confirm your account.');
            }
          } catch (appealError) {
            console.error('Error saving appeal:', appealError);
          }
        }

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

  return (
    <Card className="w-full max-w-md bg-zinc-900 border-zinc-700">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-white text-center">
          Create Account
        </CardTitle>
        <CardDescription className="text-gray-400 text-center">
          Join Appeal Your PCN to get your first appeal FREE
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
              Create an account to save your generated appeal and track its progress.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-2">
              Full Name
            </label>
            <Input
              id="fullName"
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Enter your full name"
              className="bg-zinc-800 border-zinc-600 text-white placeholder-gray-400"
              required
            />
          </div>

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
              placeholder="Create a strong password"
              className="bg-zinc-800 border-zinc-600 text-white placeholder-gray-400"
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
              requirements={passwordRequirements}
              required
            />
            {formData.password && (
              <div className="mt-2">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium ${getPasswordStrengthColor(passwordStrength)}`}>
                    {getPasswordStrengthText(passwordStrength)}
                  </span>
                  <div className="flex space-x-1">
                    {[1, 2, 3].map((level) => (
                      <div
                        key={level}
                        className={`h-1 w-8 rounded ${
                          level <= (passwordStrength === 'weak' ? 1 : passwordStrength === 'medium' ? 2 : 3)
                            ? passwordStrength === 'weak' ? 'bg-red-500' : passwordStrength === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                            : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
              Confirm Password
            </label>
            <PasswordInput
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Confirm your password"
              className="bg-zinc-800 border-zinc-600 text-white placeholder-gray-400"
              showPassword={showConfirmPassword}
              onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
              error={formData.confirmPassword && !passwordsMatch ? 'Passwords do not match' : ''}
              required
            />
            {formData.confirmPassword && passwordsMatch && (
              <p className="mt-1 text-sm text-green-500 flex items-center">
                <CheckCircle className="h-3 w-3 mr-1" />
                Passwords match
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading || !isPasswordComplete || !passwordsMatch}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Creating Account...
              </div>
            ) : (
              'Create Account'
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
            Already have an account?{' '}
            <button
              onClick={() => router.push('/login')}
              className="text-blue-400 hover:text-blue-300 font-medium"
            >
              Sign in
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

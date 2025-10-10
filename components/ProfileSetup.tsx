'use client';
import { useState } from 'react';
import { User, Save, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface UserProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  vehicle_registration: string | null;
  free_appeals_used: number;
  paid_appeals_used: number;
  total_appeals_created: number;
  last_free_appeal_reset: string | null;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
  last_activity: string | null;
}

interface ProfileSetupProps {
  userId: string;
  profile: UserProfile;
  onProfileUpdated: () => void;
}

export function ProfileSetup({ userId, profile, onProfileUpdated }: ProfileSetupProps) {
  const [formData, setFormData] = useState({
    firstName: profile.first_name || '',
    lastName: profile.last_name || '',
    email: profile.email || '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/user-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          firstName: formData.firstName,
          lastName: formData.lastName,
        }),
      });

      if (response.ok) {
        setMessage('Profile updated successfully!');
        onProfileUpdated();
      } else {
        const error = await response.json();
        setMessage(`Error: ${error.error}`);
      }
    } catch {
      setMessage('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const getCompletionPercentage = () => {
    let completion = 0;
    if (formData.firstName) completion += 25;
    if (formData.lastName) completion += 25;
    if (profile.vehicle_registration) completion += 25;
    if (profile.stripe_customer_id) completion += 25;
    return completion;
  };

  const isComplete = getCompletionPercentage() === 100;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Profile Settings</h2>
        <p className="text-gray-400">Manage your personal information and account details</p>
      </div>

      {/* Profile Completion */}
      <Card className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-500/30">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-400">
            <User className="h-5 w-5 mr-2" />
            Profile Completion
          </CardTitle>
          <CardDescription>
            Complete your profile to get the most out of Appeal Your PCN
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Completion</span>
              <span className="text-sm font-medium text-blue-400">{getCompletionPercentage()}%</span>
            </div>
            <div className="w-full bg-zinc-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getCompletionPercentage()}%` }}
              />
            </div>
            {isComplete && (
              <div className="flex items-center text-green-400 text-sm">
                <CheckCircle className="h-4 w-4 mr-2" />
                Profile complete! You&apos;re all set.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card className="bg-zinc-900 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white">Personal Information</CardTitle>
          <CardDescription>
            Update your name and contact information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Enter your first name"
                className="bg-zinc-800 border-zinc-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Enter your last name"
                className="bg-zinc-800 border-zinc-600 text-white"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              value={formData.email}
              disabled
              className="bg-zinc-800 border-zinc-600 text-gray-400"
            />
            <p className="text-xs text-gray-500 mt-1">
              Email cannot be changed. Contact support if you need to update it.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Account Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-zinc-900 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white text-lg">Account Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Email Verified</span>
              <Badge variant="default" className="bg-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Stripe Customer</span>
              <Badge variant={profile.stripe_customer_id ? "default" : "secondary"}>
                {profile.stripe_customer_id ? 'Connected' : 'Not Connected'}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Member Since</span>
              <span className="text-white text-sm">
                {new Date(profile.created_at).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white text-lg">Usage Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Total Appeals</span>
              <span className="text-white font-medium">{profile.total_appeals_created}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Free Appeals Used</span>
              <span className="text-white font-medium">{profile.free_appeals_used}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Paid Appeals</span>
              <span className="text-white font-medium">{profile.paid_appeals_used}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-500"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('successfully') 
            ? 'bg-green-900/20 border border-green-500/30 text-green-400' 
            : 'bg-red-900/20 border border-red-500/30 text-red-400'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
}

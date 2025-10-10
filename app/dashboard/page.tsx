'use client';
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { Car, Plus, Settings, LogOut, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VehicleManagement } from '@/components/VehicleManagement';
import { ProfileSetup } from '@/components/ProfileSetup';
import { AppealHistory } from '@/components/AppealHistory';
import { UsageStats } from '@/components/UsageStats';

interface UserProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  vehicle_registration: string;
  free_appeals_used: number;
  paid_appeals_used: number;
  total_appeals_created: number;
  last_free_appeal_reset: string;
  stripe_customer_id: string;
  created_at: string;
  updated_at: string;
  last_activity: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const getUser = () => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
          router.push('/auth');
          return;
        }
        
        setUser(session.user);
        fetchProfile(session.user.id).then(() => {
          setLoading(false);
        }).catch((error) => {
          console.error('Error fetching profile:', error);
          setLoading(false);
        });
      }).catch((error) => {
        console.error('Auth check failed:', error);
        router.push('/auth');
      });
    };

    getUser();
  }, [router, supabase]);

  const fetchProfile = async (userId: string) => {
    try {
      const response = await fetch(`/api/user-profile?userId=${userId}`);
      const data = await response.json();
      setProfile(data.profile);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const getProfileCompletion = () => {
    if (!profile) return 0;
    let completion = 0;
    if (profile.first_name) completion += 20;
    if (profile.last_name) completion += 20;
    if (profile.vehicle_registration) completion += 30;
    if (profile.email) completion += 10;
    if (profile.stripe_customer_id) completion += 20;
    return completion;
  };

  const hasFreeAppeal = () => {
    if (!profile) return false;
    const now = new Date();
    const lastReset = new Date(profile.last_free_appeal_reset);
    const daysSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24);
    return profile.free_appeals_used === 0 || daysSinceReset > 30;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Profile Not Found</h2>
          <p className="text-gray-400 mb-4">We couldn&apos;t find your profile. Please try again.</p>
          <Button onClick={() => router.push('/auth')} variant="outline">
            Go to Auth
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="text-2xl font-bold text-white">🎯 Appeal Your PCN</div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-400">
                Welcome, {profile.first_name || user.email}
              </div>
              <Button
                onClick={handleSignOut}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {profile.first_name || 'there'}!
          </h1>
          <p className="text-gray-400">
            Manage your appeals, vehicles, and account settings.
          </p>
        </div>

        {/* Profile Completion */}
        {getProfileCompletion() < 100 && (
          <Card className="mb-6 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-500/30">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-400">
                <Settings className="h-5 w-5 mr-2" />
                Complete Your Profile
              </CardTitle>
              <CardDescription>
                Finish setting up your account to get the most out of Appeal Your PCN
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Profile Completion</span>
                  <span className="text-sm font-medium text-blue-400">{getProfileCompletion()}%</span>
                </div>
                <Progress value={getProfileCompletion()} className="h-2" />
                <div className="text-xs text-gray-400">
                  Add your name, vehicle details, and payment info to complete your profile
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-zinc-900 border-zinc-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Appeals</p>
                  <p className="text-2xl font-bold text-white">{profile.total_appeals_created}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Free Appeals</p>
                  <p className="text-2xl font-bold text-white">
                    {hasFreeAppeal() ? 'Available' : 'Used'}
                  </p>
                </div>
                <Badge variant={hasFreeAppeal() ? 'default' : 'secondary'}>
                  {hasFreeAppeal() ? 'Ready' : 'Used'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">Vehicles</p>
                  <p className="text-2xl font-bold text-white">
                    {profile.vehicle_registration ? '1' : '0'}
                  </p>
                </div>
                <Car className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-zinc-900 border-zinc-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-zinc-700">
              Overview
            </TabsTrigger>
            <TabsTrigger value="vehicles" className="data-[state=active]:bg-zinc-700">
              Vehicles
            </TabsTrigger>
            <TabsTrigger value="appeals" className="data-[state=active]:bg-zinc-700">
              Appeals
            </TabsTrigger>
            <TabsTrigger value="profile" className="data-[state=active]:bg-zinc-700">
              Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <UsageStats userId={user.id} />
              <Card className="bg-zinc-900 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-white">Quick Actions</CardTitle>
                  <CardDescription>Get started with your PCN appeals</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={() => router.push('/')} 
                    className="w-full bg-blue-600 hover:bg-blue-500"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Appeal
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full border-zinc-600 text-white hover:bg-zinc-800"
                  >
                    <Car className="h-4 w-4 mr-2" />
                    Add Vehicle
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="vehicles">
            <VehicleManagement 
              userId={user.id} 
              currentVehicle={profile.vehicle_registration}
              onVehicleAdded={() => fetchProfile(user.id)}
            />
          </TabsContent>

          <TabsContent value="appeals">
            <AppealHistory userId={user.id} />
          </TabsContent>

          <TabsContent value="profile">
            <ProfileSetup 
              userId={user.id}
              profile={profile}
              onProfileUpdated={() => fetchProfile(user.id)}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
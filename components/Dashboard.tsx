'use client';
import { useEffect, useState, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '../lib/auth';
import UsageStats from './UsageStats';

interface Appeal {
  id: string;
  content: string;
  number_plate: string | null;
  ticket_value: number;
  status: 'draft' | 'submitted' | 'accepted' | 'rejected';
  created_at: string;
  is_free_appeal: boolean;
}

export default function Dashboard() {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState<{ hasFreeAppeal: boolean; freeAppealsUsed: number; paidAppealsUsed: number } | null>(null);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const checkAuth = () => {
      getCurrentUser().then((currentUser) => {
        if (!currentUser) {
          router.push('/auth');
          return;
        }
        setUser(currentUser);
        fetchAppeals(currentUser.id);
        fetchUsage(currentUser.id);
      }).catch((error) => {
        console.error('Auth check failed:', error);
        router.push('/auth');
      });
    };
    checkAuth();
  }, [router, fetchAppeals]);

  const fetchAppeals = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('appeals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAppeals(data || []);
    } catch (error) {
      console.error('Error fetching appeals:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const fetchUsage = async (userId: string) => {
    try {
      const response = await fetch(`/api/check-usage?userId=${userId}`);
      const data = await response.json();
      setUsage(data);
    } catch (error) {
      console.error('Failed to fetch usage:', error);
    }
  };

  const handleSignOut = async () => {
    const { signOut } = await import('../lib/auth');
    await signOut();
    router.push('/');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-yellow-900 text-yellow-300';
      case 'submitted': return 'bg-blue-900 text-blue-300';
      case 'accepted': return 'bg-green-900 text-green-300';
      case 'rejected': return 'bg-red-900 text-red-300';
      default: return 'bg-gray-900 text-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-700">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Your Dashboard</h1>
              <p className="text-gray-400">Welcome back, {user?.email}</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => router.push('/')}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Create New Appeal
              </button>
              <button
                onClick={handleSignOut}
                className="bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Usage Stats */}
        {usage && <UsageStats userId={user.id} />}

        {/* Appeals Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-6">Your Appeals</h2>
          
          {appeals.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold mb-2">No appeals yet</h3>
              <p className="text-gray-400 mb-6">Create your first appeal to get started!</p>
              <button
                onClick={() => router.push('/')}
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Create Your First Appeal
              </button>
            </div>
          ) : (
            <div className="grid gap-6">
              {appeals.map((appeal) => (
                <div key={appeal.id} className="bg-zinc-900 rounded-lg p-6 border border-zinc-700">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">
                        Appeal #{appeal.id.slice(-8)}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        Created: {formatDate(appeal.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appeal.status)}`}>
                        {appeal.status.charAt(0).toUpperCase() + appeal.status.slice(1)}
                      </span>
                      {appeal.is_free_appeal && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-900 text-green-300">
                          Free Appeal
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {appeal.number_plate && (
                    <p className="text-gray-300 mb-3">
                      <strong>Vehicle:</strong> {appeal.number_plate}
                    </p>
                  )}
                  
                  {appeal.ticket_value > 0 && (
                    <p className="text-gray-300 mb-3">
                      <strong>Ticket Value:</strong> £{(appeal.ticket_value / 100).toFixed(2)}
                    </p>
                  )}
                  
                  <div className="bg-zinc-800 rounded-lg p-4 mb-4">
                    <h4 className="font-medium mb-2">Appeal Content:</h4>
                    <div className="text-sm text-gray-300 whitespace-pre-wrap max-h-40 overflow-y-auto">
                      {appeal.content}
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(appeal.content);
                        alert('Appeal copied to clipboard!');
                      }}
                      className="bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                      Copy Appeal
                    </button>
                    
                    {appeal.status === 'draft' && (
                      <button
                        onClick={() => {
                          // Here you would implement the submit functionality
                          alert('Submit functionality coming soon!');
                        }}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                      >
                        Submit Appeal
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

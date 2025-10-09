'use client';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';

interface UsageStatsProps {
  userId: string;
}

interface UserStats {
  vehicleReg: string;
  totalAppeals: number;
  successfulAppeals: number;
  unsuccessfulAppeals: number;
  pendingAppeals: number;
  totalTicketValue: number;
  totalSavings: number;
  freeAppealsUsed: number;
  paidAppealsUsed: number;
  hasFreeAppeal: boolean;
}

export default function UsageStats({ userId }: UsageStatsProps) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/check-usage?userId=${userId}`);
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch usage stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchStats();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700">
        <div className="animate-pulse">
          <div className="h-4 bg-zinc-700 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-zinc-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const formatCurrency = (pence: number) => `£${(pence / 100).toFixed(2)}`;

  return (
    <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-700 mb-6">
      <h3 className="text-lg font-semibold mb-4">Your Dashboard</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">Vehicle Registration</h4>
          <p className="text-white font-mono">{stats.vehicleReg || 'Not set'}</p>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">Free Appeals This Month</h4>
          <p className="text-white">
            {stats.hasFreeAppeal ? '1 available' : '0 available'}
          </p>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">Total Appeals</h4>
          <p className="text-white">{stats.totalAppeals}</p>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">Successful</h4>
          <p className="text-green-400">{stats.successfulAppeals}</p>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">Pending</h4>
          <p className="text-yellow-400">{stats.pendingAppeals}</p>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">Total Savings</h4>
          <p className="text-green-400 font-semibold">{formatCurrency(stats.totalSavings)}</p>
        </div>
      </div>
    </div>
  );
}


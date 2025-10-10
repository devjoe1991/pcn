'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CustomSignupForm } from '@/components/CustomSignupForm';

interface PendingAppeal {
  content: string;
  numberPlate: string;
  ticketValue: number;
}

export default function SignUpPage() {
  const [pendingAppeal, setPendingAppeal] = useState<PendingAppeal | null>(null);
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
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Join Appeal Your PCN</h1>
          <p className="text-gray-400">Create your account to get started</p>
        </div>
        
        <CustomSignupForm pendingAppeal={pendingAppeal} />
      </div>
    </div>
  );
}
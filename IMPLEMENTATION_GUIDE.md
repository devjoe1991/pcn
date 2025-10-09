# PCN Appeals System Implementation Guide

## Overview
This guide provides step-by-step tasks to implement a streamlined PCN (Penalty Charge Notice) appeals system with:
- **Seamless authentication flow** - Users click chat → redirected to Supabase Auth UI
- **One free appeal per month** for each user
- **Automatic vehicle detection** - OCR extracts number plate, prompts to add if new
- **Pay to add additional vehicles** (£3 per vehicle after first)
- **Photo upload with OCR** to automatically scan PCN tickets
- **Single chat interface** for appeal generation and management
- **Dashboard integration** - Appeals saved by vehicle number

## Prerequisites
- OpenAI API key (for both ChatGPT and Vision)
- Stripe account and API keys
- Supabase project (already configured with CLI)
- Node.js and pnpm installed
- Supabase CLI installed and linked to your project

---

## Phase 1: Database Setup

### Task 1.1: Create Simplified Database Schema
**Prompt:** "Create a single efficient users table with all necessary columns for tracking appeals, vehicles, and savings using Supabase CLI"

**Commands to run:**
```bash
# Create a new migration file
supabase migration new create_users_table

# This will create a file like: supabase/migrations/20240101000001_create_users_table.sql
# Then add the SQL content below to that file
```

**Add the following SQL to the generated migration file:**
```sql
-- Single comprehensive users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stripe_customer_id TEXT UNIQUE, -- Stripe customer ID for easy linking
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    
    -- Vehicle information
    vehicle_reg TEXT, -- Primary vehicle registration
    
    -- Appeal tracking
    total_appeals INTEGER DEFAULT 0,
    successful_appeals INTEGER DEFAULT 0,
    unsuccessful_appeals INTEGER DEFAULT 0,
    pending_appeals INTEGER DEFAULT 0,
    
    -- Financial tracking
    total_ticket_value INTEGER DEFAULT 0, -- Total value of all PCN tickets in pence
    total_savings INTEGER DEFAULT 0, -- Total money saved from successful appeals in pence
    
    -- Usage tracking
    free_appeals_used INTEGER DEFAULT 0,
    paid_appeals_used INTEGER DEFAULT 0,
    last_free_appeal_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own data" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON public.users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_vehicle_reg ON public.users(vehicle_reg);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

**After adding the SQL, apply the migration:**
```bash
# Apply the migration to your local development database
supabase db reset

# Or apply just this migration
supabase migration up
```

### Task 1.2: Create Appeals Table
**Prompt:** "Create appeals table to store individual appeal records"

**Commands to run:**
```bash
# Create a new migration for appeals table
supabase migration new create_appeals_table
```

**Add the following SQL to the generated migration file:**
```sql
-- Appeals table to store individual appeal records
CREATE TABLE IF NOT EXISTS public.appeals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    number_plate TEXT NOT NULL,
    appeal_content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'successful', 'unsuccessful')),
    ticket_value INTEGER DEFAULT 0, -- Value of the PCN ticket in pence
    is_free_appeal BOOLEAN DEFAULT false,
    image_url TEXT, -- URL of uploaded PCN image
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.appeals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own appeals" ON public.appeals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own appeals" ON public.appeals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own appeals" ON public.appeals FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_appeals_user_id ON public.appeals(user_id);
CREATE INDEX IF NOT EXISTS idx_appeals_number_plate ON public.appeals(number_plate);
CREATE INDEX IF NOT EXISTS idx_appeals_status ON public.appeals(status);
CREATE INDEX IF NOT EXISTS idx_appeals_created_at ON public.appeals(created_at);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_appeals_updated_at 
    BEFORE UPDATE ON public.appeals 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

**Apply the appeals migration:**
```bash
# Apply the new migration
supabase migration up
```

---

## Phase 2: Dependencies and Environment

### Task 2.1: Install Required Packages
**Prompt:** "Install OpenAI, Stripe, and file upload packages using pnpm"

**Command:**
```bash
pnpm add openai stripe @stripe/stripe-js @supabase/ssr
pnpm add -D @types/stripe
```

### Task 2.2: Environment Variables Setup
**Prompt:** "Create environment variables file with OpenAI and Stripe keys"

**File:** `.env.local`
```env
OPENAI_API_KEY=your_openai_api_key_here
STRIPE_SECRET_KEY=your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## Phase 3: Authentication System

### Task 3.1: Create Authentication Utilities with Stripe Integration
**Prompt:** "Create authentication helper functions for Supabase auth with automatic Stripe customer creation"

**File:** `lib/auth.ts`
```typescript
import { supabase } from './supabase';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export const signUp = async (email: string, password: string, fullName: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      }
    }
  });

  // If signup successful, create Stripe customer and link to user
  if (data.user && !error) {
    try {
      const stripeCustomer = await stripe.customers.create({
        email: email,
        name: fullName,
        metadata: {
          supabase_user_id: data.user.id
        }
      });

      // Update user record with Stripe customer ID
      await supabase
        .from('users')
        .update({ stripe_customer_id: stripeCustomer.id })
        .eq('id', data.user.id);
    } catch (stripeError) {
      console.error('Failed to create Stripe customer:', stripeError);
    }
  }

  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const getStripeCustomerId = async (userId: string) => {
  const { data } = await supabase
    .from('users')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();
  
  return data?.stripe_customer_id;
};
```

### Task 3.2: Create Streamlined Authentication Flow
**Prompt:** "Create seamless authentication using Supabase Auth UI with automatic redirects"

**File:** `app/auth/page.tsx`
```typescript
'use client';
import { useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.push('/');
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase, router]);

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    });
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-zinc-900 rounded-lg p-8 border border-zinc-700 text-center">
          <h1 className="text-2xl font-bold mb-6">Sign in to continue</h1>
          <p className="text-gray-400 mb-8">Create your appeal with AI assistance</p>
          <button
            onClick={handleSignIn}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium"
          >
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}
```

**File:** `components/AuthRedirect.tsx`
```typescript
'use client';
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

export default function AuthRedirect() {
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/');
      } else {
        router.push('/auth');
      }
      setLoading(false);
    };
    checkAuth();
  }, [supabase, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }
  return null;
}
```

---

## Phase 4: OCR and Image Upload System

### Task 4.1: Create Supabase Storage Bucket
**Prompt:** "Create storage bucket for PCN images using Supabase CLI"

**Commands to run:**
```bash
# Create storage bucket for PCN images
supabase storage create pcn-images --public

# Set up storage policies
supabase storage policy create pcn-images-policy --bucket pcn-images --policy-file storage-policy.json
```

**Create file:** `storage-policy.json`
```json
{
  "policies": [
    {
      "name": "Users can upload their own images",
      "definition": "auth.uid() = (storage.foldername(name))[1]::uuid"
    },
    {
      "name": "Users can view their own images",
      "definition": "auth.uid() = (storage.foldername(name))[1]::uuid"
    }
  ]
}
```

### Task 4.2: Create Image Upload API with OpenAI Vision
**Prompt:** "Create API endpoint for uploading PCN images with OpenAI Vision OCR processing"

**File:** `app/api/upload-pcn/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '../../../lib/supabase';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Convert file to buffer and base64
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Image = buffer.toString('base64');

    // Use OpenAI Vision to extract text from image
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all text from this PCN (Penalty Charge Notice) ticket. Focus on: number plate, PCN number, penalty amount, issue date, and location. Return the information in a structured format."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${file.type};base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
    });

    const extractedText = response.choices[0]?.message?.content || '';
    
    if (!extractedText) {
      return NextResponse.json({ error: 'No text detected in image' }, { status: 400 });
    }

    // Parse the extracted text to get structured data
    const extractedData = extractPCNData(extractedText);

    // Upload image to Supabase Storage
    const fileName = `pcn-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('pcn-images')
      .upload(fileName, buffer, {
        contentType: file.type,
      });

    if (uploadError) {
      return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('pcn-images')
      .getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      imageUrl: publicUrl,
      extractedData,
      fullText: extractedText
    });

  } catch (error) {
    console.error('OCR processing error:', error);
    return NextResponse.json({ error: 'OCR processing failed' }, { status: 500 });
  }
}

function extractPCNData(text: string) {
  // Extract number plate (UK format)
  const plateRegex = /[A-Z]{2}[0-9]{2}\s?[A-Z]{3}|[A-Z][0-9]{1,3}\s?[A-Z]{3}/i;
  const numberPlate = text.match(plateRegex)?.[0]?.toUpperCase() || '';

  // Extract PCN number
  const pcnRegex = /PCN[:\s]*([A-Z0-9]{8,12})/i;
  const pcnNumber = text.match(pcnRegex)?.[1] || '';

  // Extract amount
  const amountRegex = /£?(\d+\.?\d*)/g;
  const amounts = text.match(amountRegex) || [];
  const penaltyAmount = amounts[0] || '';

  // Extract date
  const dateRegex = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/g;
  const dates = text.match(dateRegex) || [];
  const issueDate = dates[0] || '';

  // Extract location
  const locationRegex = /(?:at|location|where)[:\s]*([A-Za-z\s,]+)/i;
  const location = text.match(locationRegex)?.[1]?.trim() || '';

  return {
    numberPlate,
    pcnNumber,
    penaltyAmount,
    issueDate,
    location,
    fullText: text
  };
}
```

### Task 4.2: Create Image Upload Component
**Prompt:** "Create a photo upload component with drag-and-drop functionality for PCN tickets"

**File:** `components/ImageUpload.tsx`
```typescript
'use client';
import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface ImageUploadProps {
  onImageProcessed: (data: any) => void;
  onError: (error: string) => void;
}

export default function ImageUpload({ onImageProcessed, onError }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList) => {
    if (files.length === 0) return;
    
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      onError('Please select an image file');
      return;
    }

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload-pcn', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        onImageProcessed(data);
      } else {
        onError(data.error || 'Failed to process image');
      }
    } catch (error) {
      onError('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  return (
    <div className="w-full">
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
        />
        
        <div className="space-y-4">
          <div className="mx-auto w-12 h-12 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          
          <div>
            <p className="text-lg font-medium text-gray-900">
              {isUploading ? 'Processing image...' : 'Upload your PCN ticket'}
            </p>
            <p className="text-sm text-gray-500">
              Drag and drop your PCN image here, or click to browse
            </p>
          </div>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isUploading ? 'Processing...' : 'Choose File'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## Phase 5: OpenAI Integration

### Task 4.1: Update Chat API Route
**Prompt:** "Replace the mock chat API with OpenAI ChatGPT integration for PCN appeals"

**File:** `app/api/chat/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { messages, userContext } = await request.json();
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    // Create a system prompt for PCN appeals
    const systemPrompt = `You are Kerbi, an AI assistant specialized in helping people create effective PCN (Penalty Charge Notice) appeals. 

Your role is to:
1. Help users gather relevant information about their PCN
2. Identify potential grounds for appeal (technical errors, signage issues, mitigating circumstances, etc.)
3. Draft professional, persuasive appeal letters
4. Provide guidance on the appeals process

Always be helpful, professional, and focus on legitimate grounds for appeal. Never encourage false claims.

Current user context: ${userContext || 'No specific context provided'}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const aiResponse = response.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response. Please try again.";

    return NextResponse.json({ 
      reply: aiResponse,
      usage: response.usage 
    });
  } catch (error) {
    console.error('OpenAI API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' }, 
      { status: 500 }
    );
  }
}
```

---

## Phase 5: Dashboard System

### Task 5.1: Create Dashboard Component
**Prompt:** "Create a dashboard component that displays user appeals organized by number plate with status tracking"

**File:** `components/Dashboard.tsx`
```typescript
'use client';
import { useState, useEffect } from 'react';
import { getCurrentUser } from '../lib/auth';
import UsageStats from './UsageStats';

interface Appeal {
  id: string;
  number_plate: string;
  appeal_content: string;
  status: 'pending' | 'submitted' | 'successful' | 'unsuccessful';
  created_at: string;
  ticket_value: number;
  image_url?: string;
}

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserAndAppeals = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);

      if (currentUser) {
        // Fetch appeals from API
        try {
          const response = await fetch(`/api/appeals?userId=${currentUser.id}`);
          const data = await response.json();
          setAppeals(data.appeals || []);
        } catch (error) {
          console.error('Failed to fetch appeals:', error);
        }
      }
      setLoading(false);
    };

    fetchUserAndAppeals();
  }, []);

  const updateAppealStatus = async (appealId: string, status: 'successful' | 'unsuccessful') => {
    try {
      const response = await fetch('/api/update-appeal-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user.id, 
          appealId, 
          status,
          ticketValue: appeals.find(a => a.id === appealId)?.ticket_value || 0
        }),
      });

      if (response.ok) {
        setAppeals(prev => prev.map(appeal => 
          appeal.id === appealId ? { ...appeal, status } : appeal
        ));
      }
    } catch (error) {
      console.error('Failed to update appeal status:', error);
    }
  };

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Your Appeals Dashboard</h1>
        
        {/* Usage Stats */}
        {user && <UsageStats userId={user.id} />}
        
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-6">Your Appeals</h2>
          
          {appeals.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">No appeals yet. Create your first appeal to get started!</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {appeals.map((appeal) => (
                <div key={appeal.id} className="bg-zinc-900 rounded-lg p-6 border border-zinc-700">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold">Number Plate: {appeal.number_plate}</h3>
                      <p className="text-gray-400">Created: {new Date(appeal.created_at).toLocaleDateString()}</p>
                      {appeal.ticket_value > 0 && (
                        <p className="text-gray-400">Ticket Value: £{(appeal.ticket_value / 100).toFixed(2)}</p>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      appeal.status === 'successful' ? 'bg-green-600' :
                      appeal.status === 'unsuccessful' ? 'bg-red-600' :
                      appeal.status === 'submitted' ? 'bg-blue-600' :
                      'bg-yellow-600'
                    }`}>
                      {appeal.status}
                    </span>
                  </div>
                  
                  {appeal.image_url && (
                    <div className="mb-4">
                      <img 
                        src={appeal.image_url} 
                        alt="PCN Ticket" 
                        className="max-w-xs rounded-lg border border-zinc-600"
                      />
                    </div>
                  )}
                  
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">Appeal Content:</h4>
                    <p className="text-gray-300 whitespace-pre-wrap">{appeal.appeal_content}</p>
                  </div>

                  {appeal.status === 'submitted' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateAppealStatus(appeal.id, 'successful')}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg"
                      >
                        Mark as Successful
                      </button>
                      <button
                        onClick={() => updateAppealStatus(appeal.id, 'unsuccessful')}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
                      >
                        Mark as Unsuccessful
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

### Task 5.2: Create Dashboard Page
**Prompt:** "Create a dashboard page route that renders the dashboard component"

**File:** `app/dashboard/page.tsx`
```typescript
import Dashboard from '../../components/Dashboard';

export default function DashboardPage() {
  return <Dashboard />;
}
```

---

## Phase 6: Payment Integration

### Task 6.1: Create Payment Intent API with Customer Linking
**Prompt:** "Create Stripe payment intent API using customer ID for easy Stripe dashboard linking"

**File:** `app/api/create-payment-intent/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '../../../lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export async function POST(request: NextRequest) {
  try {
    const { appealId, userId, paymentType } = await request.json();

    // Get user's Stripe customer ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('stripe_customer_id, email, full_name')
      .eq('id', userId)
      .single();

    if (userError || !userData?.stripe_customer_id) {
      return NextResponse.json({ error: 'User not found or no Stripe customer ID' }, { status: 404 });
    }

    // Determine amount based on payment type
    const amounts = {
      additional_appeal: 500, // £5 in pence
      vehicle_addition: 300, // £3 in pence
    };

    const amount = amounts[paymentType as keyof typeof amounts] || 500;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'gbp',
      customer: userData.stripe_customer_id, // Link to existing Stripe customer
      metadata: {
        appealId,
        userId,
        paymentType,
        userEmail: userData.email,
        userName: userData.full_name
      },
      description: paymentType === 'additional_appeal' 
        ? 'Additional PCN Appeal - £5' 
        : 'Vehicle Registration Change - £3'
    });

    return NextResponse.json({ 
      clientSecret: paymentIntent.client_secret,
      customerId: userData.stripe_customer_id // Return for easy Stripe dashboard linking
    });
  } catch (error) {
    console.error('Stripe error:', error);
    return NextResponse.json({ error: 'Payment failed' }, { status: 500 });
  }
}
```

### Task 6.2: Create Payment Component
**Prompt:** "Create a payment component with Stripe Elements for processing £5 payments"

**File:** `components/PaymentForm.tsx`
```typescript
'use client';
import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function CheckoutForm({ appealId, onSuccess }: { appealId: string, onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);

    try {
      const { data } = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appealId }),
      }).then(res => res.json());

      const { error } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        }
      });

      if (error) {
        console.error('Payment failed:', error);
      } else {
        onSuccess();
      }
    } catch (err) {
      console.error('Payment error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border border-zinc-600 rounded-lg">
        <CardElement />
      </div>
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Pay £5.00'}
      </button>
    </form>
  );
}

export default function PaymentForm({ appealId, onSuccess }: { appealId: string, onSuccess: () => void }) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm appealId={appealId} onSuccess={onSuccess} />
    </Elements>
  );
}
```

---

## Phase 7: Usage Tracking and Free Appeal Management

### Task 7.1: Create Usage Tracking API
**Prompt:** "Create API endpoints for tracking free appeals and managing monthly limits using the simplified users table"

**File:** `app/api/check-usage/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get user data with all tracking information
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if free appeal reset is needed (monthly)
    const now = new Date();
    const lastReset = new Date(userData.last_free_appeal_reset);
    const needsReset = now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear();

    if (needsReset) {
      // Reset free appeals for new month
      const { error: resetError } = await supabase
        .from('users')
        .update({ 
          free_appeals_used: 0,
          last_free_appeal_reset: now.toISOString()
        })
        .eq('id', userId);

      if (!resetError) {
        userData.free_appeals_used = 0;
      }
    }

    const hasFreeAppeal = userData.free_appeals_used < 1;
    const nextResetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    return NextResponse.json({
      hasFreeAppeal,
      freeAppealsUsed: userData.free_appeals_used,
      totalAppeals: userData.total_appeals,
      successfulAppeals: userData.successful_appeals,
      unsuccessfulAppeals: userData.unsuccessful_appeals,
      pendingAppeals: userData.pending_appeals,
      totalSavings: userData.total_savings,
      totalTicketValue: userData.total_ticket_value,
      vehicleReg: userData.vehicle_reg,
      nextResetDate: nextResetDate.toISOString()
    });

  } catch (error) {
    console.error('Usage check error:', error);
    return NextResponse.json({ error: 'Failed to check usage' }, { status: 500 });
  }
}
```

### Task 7.2: Create Vehicle Management API
**Prompt:** "Create API for managing user vehicle registration using the simplified users table"

**File:** `app/api/vehicles/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const { data: userData, error } = await supabase
      .from('users')
      .select('vehicle_reg')
      .eq('id', userId)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch vehicle' }, { status: 500 });
    }

    return NextResponse.json({ 
      vehicleReg: userData?.vehicle_reg || null 
    });

  } catch (error) {
    console.error('Vehicle fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch vehicle' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, vehicleReg } = await request.json();
    
    if (!userId || !vehicleReg) {
      return NextResponse.json({ error: 'User ID and vehicle registration required' }, { status: 400 });
    }

    // Check if user already has a vehicle registered
    const { data: existingUser } = await supabase
      .from('users')
      .select('vehicle_reg')
      .eq('id', userId)
      .single();

    if (existingUser?.vehicle_reg) {
      return NextResponse.json({ 
        requiresPayment: true,
        amount: 300, // £3 in pence
        paymentType: 'vehicle_addition',
        message: 'Changing vehicle registration costs £3'
      });
    }

    // Update user with vehicle registration (first one is free)
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({
        vehicle_reg: vehicleReg.toUpperCase()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update vehicle' }, { status: 500 });
    }

    return NextResponse.json({ 
      vehicleReg: updatedUser.vehicle_reg,
      isFirstVehicle: true
    });

  } catch (error) {
    console.error('Vehicle update error:', error);
    return NextResponse.json({ error: 'Failed to update vehicle' }, { status: 500 });
  }
}
```

### Task 7.3: Create Usage Management Component
**Prompt:** "Create a component to display user's usage stats, savings, and remaining free appeals"

**File:** `components/UsageStats.tsx`
```typescript
'use client';
import { useState, useEffect } from 'react';

interface UsageStatsProps {
  userId: string;
}

interface UsageData {
  hasFreeAppeal: boolean;
  freeAppealsUsed: number;
  totalAppeals: number;
  successfulAppeals: number;
  unsuccessfulAppeals: number;
  pendingAppeals: number;
  totalSavings: number;
  totalTicketValue: number;
  vehicleReg: string;
  nextResetDate: string;
}

export default function UsageStats({ userId }: UsageStatsProps) {
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const response = await fetch('/api/check-usage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });

        const data = await response.json();
        setUsageData(data);
      } catch (error) {
        console.error('Failed to fetch usage data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUsage();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700">
        <div className="animate-pulse">
          <div className="h-4 bg-zinc-700 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-zinc-700 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!usageData) {
    return null;
  }

  const nextResetDate = new Date(usageData.nextResetDate);
  const daysUntilReset = Math.ceil((nextResetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  const formatCurrency = (pence: number) => {
    return `£${(pence / 100).toFixed(2)}`;
  };

  return (
    <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700">
      <h3 className="text-lg font-semibold text-white mb-3">Your Dashboard</h3>
      
      <div className="space-y-3">
        {/* Vehicle Registration */}
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Vehicle:</span>
          <span className="text-white font-semibold">
            {usageData.vehicleReg || 'Not registered'}
          </span>
        </div>

        {/* Free Appeals */}
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Free appeals this month:</span>
          <span className={`font-semibold ${usageData.hasFreeAppeal ? 'text-green-400' : 'text-red-400'}`}>
            {usageData.hasFreeAppeal ? '1 remaining' : '0 remaining'}
          </span>
        </div>
        
        {/* Appeal Stats */}
        <div className="border-t border-zinc-700 pt-3">
          <h4 className="text-sm font-semibold text-gray-300 mb-2">Appeal Statistics</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Total:</span>
              <span className="text-white">{usageData.totalAppeals}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Successful:</span>
              <span className="text-green-400">{usageData.successfulAppeals}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Unsuccessful:</span>
              <span className="text-red-400">{usageData.unsuccessfulAppeals}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Pending:</span>
              <span className="text-yellow-400">{usageData.pendingAppeals}</span>
            </div>
          </div>
        </div>

        {/* Financial Stats */}
        <div className="border-t border-zinc-700 pt-3">
          <h4 className="text-sm font-semibold text-gray-300 mb-2">Financial Impact</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Total ticket value:</span>
              <span className="text-red-400 font-semibold">{formatCurrency(usageData.totalTicketValue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Money saved:</span>
              <span className="text-green-400 font-semibold">{formatCurrency(usageData.totalSavings)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Net savings:</span>
              <span className="text-green-400 font-bold text-lg">
                {formatCurrency(usageData.totalSavings - usageData.totalTicketValue)}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-400">Next reset:</span>
          <span className="text-gray-400">
            {daysUntilReset} day{daysUntilReset !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
}
```

### Task 7.4: Create Appeal Status Update API
**Prompt:** "Create API for updating appeal status and tracking financial savings"

**File:** `app/api/update-appeal-status/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userId, appealId, status, ticketValue } = await request.json();
    
    if (!userId || !appealId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get current user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate updates based on status change
    let updates: any = {};
    
    if (status === 'successful') {
      // Move from pending to successful
      updates = {
        successful_appeals: userData.successful_appeals + 1,
        pending_appeals: Math.max(0, userData.pending_appeals - 1),
        total_savings: userData.total_savings + (ticketValue || 0)
      };
    } else if (status === 'unsuccessful') {
      // Move from pending to unsuccessful
      updates = {
        unsuccessful_appeals: userData.unsuccessful_appeals + 1,
        pending_appeals: Math.max(0, userData.pending_appeals - 1)
      };
    } else if (status === 'submitted') {
      // Move from pending to submitted
      updates = {
        pending_appeals: Math.max(0, userData.pending_appeals - 1)
      };
    }

    // Update user record
    const { error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update appeal status' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Appeal status updated successfully'
    });

  } catch (error) {
    console.error('Appeal status update error:', error);
    return NextResponse.json({ error: 'Failed to update appeal status' }, { status: 500 });
  }
}
```

### Task 7.5: Create Appeal Creation API
**Prompt:** "Create API for creating new appeals and updating user statistics"

**File:** `app/api/create-appeal/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { 
      userId, 
      appealContent, 
      numberPlate, 
      ticketValue, 
      isFreeAppeal,
      imageUrl 
    } = await request.json();
    
    if (!userId || !appealContent || !numberPlate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get current user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create appeal record
    const { data: appealData, error: appealError } = await supabase
      .from('appeals')
      .insert({
        user_id: userId,
        number_plate: numberPlate.toUpperCase(),
        appeal_content: appealContent,
        ticket_value: ticketValue || 0,
        is_free_appeal: isFreeAppeal,
        image_url: imageUrl,
        status: 'pending'
      })
      .select()
      .single();

    if (appealError) {
      return NextResponse.json({ error: 'Failed to create appeal record' }, { status: 500 });
    }

    // Calculate updates for user statistics
    const updates: any = {
      total_appeals: userData.total_appeals + 1,
      pending_appeals: userData.pending_appeals + 1,
      total_ticket_value: userData.total_ticket_value + (ticketValue || 0)
    };

    if (isFreeAppeal) {
      updates.free_appeals_used = userData.free_appeals_used + 1;
    } else {
      updates.paid_appeals_used = userData.paid_appeals_used + 1;
    }

    // Update user record
    const { error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update user statistics' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Appeal created successfully',
      appealId: appealData.id,
      appealData: {
        totalAppeals: updates.total_appeals,
        pendingAppeals: updates.pending_appeals,
        isFreeAppeal
      }
    });

  } catch (error) {
    console.error('Appeal creation error:', error);
    return NextResponse.json({ error: 'Failed to create appeal' }, { status: 500 });
  }
}
```

### Task 7.6: Create Appeal Retrieval API
**Prompt:** "Create API for retrieving user's appeals for dashboard"

**File:** `app/api/appeals/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const { data: appeals, error } = await supabase
      .from('appeals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch appeals' }, { status: 500 });
    }

    return NextResponse.json({ appeals: appeals || [] });

  } catch (error) {
    console.error('Appeals fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch appeals' }, { status: 500 });
  }
}
```

---

## Phase 8: Update Hero Component

### Task 8.1: Create Streamlined Chat Interface
**Prompt:** "Create a single chat interface that handles authentication, OCR, vehicle detection, and appeal creation seamlessly"

**File:** `components/Hero.tsx` (Streamlined version)
```typescript
'use client';
import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { MovingBorder } from "./ui/moving-border";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import ImageUpload from "./ImageUpload";
import PaymentForm from "./PaymentForm";
import UsageStats from "./UsageStats";

export default function Hero() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "👋 Hi! Upload your PCN ticket photo or tell me your details - I'll create your appeal letter!" }
  ]);
  const [input, setInput] = useState("");
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [currentAppealId, setCurrentAppealId] = useState(null);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [usageData, setUsageData] = useState(null);
  const [paymentType, setPaymentType] = useState('vehicle_addition');
  const [detectedVehicle, setDetectedVehicle] = useState(null);
  const [needsVehiclePayment, setNeedsVehiclePayment] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await fetchUsageData(session.user.id);
      } else {
        // Redirect to auth if not logged in
        router.push('/auth');
      }
    };
    checkUser();
  }, [supabase, router]);

  const fetchUsageData = async (userId: string) => {
    try {
      const response = await fetch('/api/check-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await response.json();
      setUsageData(data);
    } catch (error) {
      console.error('Failed to fetch usage data:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const newMessage = { role: "user", content: input };
    setMessages(prev => [...prev, newMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: [...messages, newMessage],
          userContext: user ? `User: ${user.email}` : 'Anonymous user'
        }),
      });

      const data = await response.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch (error) {
      console.error("Error:", error);
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I'm having trouble right now. Please try again!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageProcessed = async (data: any) => {
    const { extractedData, imageUrl } = data;
    setDetectedVehicle(extractedData.numberPlate);
    
    // Check if this vehicle is already registered
    const isCurrentVehicle = usageData?.vehicleReg === extractedData.numberPlate.toUpperCase();
    
    if (!isCurrentVehicle && usageData?.vehicleReg) {
      // Different vehicle detected - need to add it
      setNeedsVehiclePayment(true);
      setPaymentType('vehicle_addition');
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: `I detected a different vehicle (${extractedData.numberPlate}) than your registered one (${usageData.vehicleReg}). To add this vehicle, there's a £3 fee. Would you like to proceed?` 
      }]);
    } else {
      // Same vehicle or first vehicle - proceed with appeal
      const extractedMessage = `I've scanned your PCN ticket. Here's what I found:

**Number Plate:** ${extractedData.numberPlate}
**PCN Number:** ${extractedData.pcnNumber}
**Penalty Amount:** ${extractedData.penaltyAmount}
**Issue Date:** ${extractedData.issueDate}
**Location:** ${extractedData.location}

I'll create your appeal letter now!`;

      setMessages(prev => [...prev, { role: "assistant", content: extractedMessage }]);
      await createAppeal(extractedData, imageUrl);
    }
    
    setShowImageUpload(false);
  };

  const handleImageError = (error: string) => {
    setMessages(prev => [...prev, { role: "assistant", content: `Sorry, I couldn't process that image: ${error}. Please try uploading a clearer photo or describe your PCN details manually.` }]);
    setShowImageUpload(false);
  };

  const createAppeal = async (extractedData: any, imageUrl: string) => {
    if (!user) return;

    const hasFreeAppeal = usageData?.hasFreeAppeal || false;
    
    if (!hasFreeAppeal) {
      setPaymentType('additional_appeal');
      setShowPayment(true);
      return;
    }

    // Create appeal with extracted data
    const appealContent = messages
      .filter(m => m.role === "assistant")
      .map(m => m.content)
      .join('\n\n');

    try {
      const response = await fetch('/api/create-appeal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          appealContent,
          numberPlate: extractedData.numberPlate,
          ticketValue: parseFloat(extractedData.penaltyAmount) * 100, // Convert to pence
          isFreeAppeal: true,
          imageUrl
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: "✅ Your free appeal has been saved to your dashboard! You can view it anytime." 
        }]);
        await fetchUsageData(user.id);
      }
    } catch (error) {
      console.error('Failed to create appeal:', error);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPayment(false);
    setNeedsVehiclePayment(false);
    
    if (paymentType === 'vehicle_addition') {
      // Update vehicle registration
      fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          vehicleReg: detectedVehicle
        }),
      }).then(() => {
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: `✅ Vehicle ${detectedVehicle} added successfully! Now I can create your appeal.` 
        }]);
        fetchUsageData(user.id);
      });
    } else {
      // Additional appeal payment
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "✅ Payment successful! Your appeal has been saved to your dashboard." 
      }]);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      <div className="relative z-30 flex flex-col items-center justify-center min-h-screen px-4 py-8">
        <MovingBorder
          borderRadius="1rem"
          className="w-full max-w-4xl h-auto"
        >
          <div className="flex flex-col bg-zinc-900/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden">
            {/* Header with user info and sign out */}
            <div className="p-4 border-b border-zinc-700/50 flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <UsageStats userId={user.id} />
              </div>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
              >
                Sign Out
              </button>
            </div>

            <div className="flex-1 p-4 sm:p-6 overflow-y-auto" style={{ height: '400px' }}>
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`mb-4 ${m.role === "user" ? "text-right" : "text-left"}`}
                >
                  <div
                    className={`inline-block max-w-xs sm:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl text-sm sm:text-base ${
                      m.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-zinc-700/80 text-gray-100"
                    }`}
                  >
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="text-left">
                  <div className="inline-block bg-zinc-700/80 text-gray-100 px-4 py-3 rounded-2xl">
                    Kerbi is thinking...
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Image Upload Section */}
            {showImageUpload && (
              <div className="p-4 border-t border-zinc-700/50">
                <ImageUpload 
                  onImageProcessed={handleImageProcessed}
                  onError={handleImageError}
                />
              </div>
            )}

            <div className="p-4 sm:p-6 border-t border-zinc-700/50 flex bg-zinc-950/90 backdrop-blur-sm">
              <input
                className="flex-1 bg-zinc-800/80 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tell me your PCN details..."
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                disabled={isLoading}
              />
              <button
                onClick={() => setShowImageUpload(!showImageUpload)}
                disabled={isLoading}
                className="mx-2 px-4 py-3 rounded-xl text-white font-medium text-sm sm:text-base transition-colors bg-green-600 hover:bg-green-500 disabled:opacity-50"
                title="Upload PCN Photo"
              >
                📷
              </button>
              <button
                onClick={sendMessage}
                disabled={isLoading}
                className="ml-2 px-6 py-3 rounded-xl text-white font-medium text-sm sm:text-base transition-colors bg-blue-600 hover:bg-blue-500 disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : 'Send'}
              </button>
            </div>

            {/* Payment Section */}
            {showPayment && (
              <div className="p-4 border-t border-zinc-700/50">
                <h3 className="text-lg font-semibold mb-4">
                  Complete Payment - {paymentType === 'additional_appeal' ? '£5' : '£3'}
                </h3>
                <PaymentForm 
                  appealId={currentAppealId} 
                  onSuccess={handlePaymentSuccess} 
                />
              </div>
            )}
          </div>
        </MovingBorder>
      </div>
    </div>
  );
}
```

---

## Phase 8: Navigation and Routing

### Task 8.1: Create Navigation Component
**Prompt:** "Create a navigation component with login/logout functionality and dashboard link"**

**File:** `components/Navigation.tsx`
```typescript
'use client';
import { useState, useEffect } from 'react';
import { getCurrentUser, signOut } from '../lib/auth';
import Link from 'next/link';

export default function Navigation() {
  const [user, setUser] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    };
    checkUser();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    window.location.href = '/';
  };

  return (
    <nav className="bg-black/90 backdrop-blur-sm border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-white">
              Kerbi
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
```

### Task 8.2: Update Layout with Navigation
**Prompt:** "Update the root layout to include navigation and proper authentication handling"**

**File:** `app/layout.tsx` (Updated)
```typescript
import type { Metadata } from "next";
import "./globals.css";
import Navigation from "../components/Navigation";

export const metadata: Metadata = {
  title: "Kerbi - AI PCN Appeals Assistant",
  description: "Your revolutionary AI-powered PCN appeal buddy",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white">
        <Navigation />
        {children}
      </body>
    </html>
  );
}
```

---

## Phase 9: Testing and Deployment

### Task 9.1: Test Authentication Flow
**Prompt:** "Test the complete authentication flow from signup to dashboard access"**

**Test Steps:**
1. Navigate to `/signup` and create a new user account
2. Check email for confirmation link (if email confirmation enabled)
3. Navigate to `/login` and sign in with credentials
4. Verify redirect to `/dashboard`
5. Check that user data is properly created in Supabase
6. Verify Stripe customer was created and linked

### Task 9.2: Test OpenAI Integration
**Prompt:** "Test OpenAI chat functionality with various PCN scenarios"**

**Test Scenarios:**
1. **Invalid parking ticket appeal**: "I was parked in a valid bay but got a ticket"
2. **Signage issues**: "The signs were unclear and I couldn't see the restrictions"
3. **Technical errors**: "The parking meter was broken when I tried to pay"
4. **Mitigating circumstances**: "I had a medical emergency and had to park illegally"

**Expected Results:**
- AI should generate professional, persuasive appeal letters
- Responses should be contextually appropriate
- No false claims should be encouraged

### Task 9.3: Test OCR and Image Upload
**Prompt:** "Test photo upload and OCR functionality"**

**Test Steps:**
1. Upload a clear PCN ticket image
2. Verify OCR extracts: number plate, PCN number, amount, date, location
3. Test with blurry or unclear images
4. Verify image is stored in Supabase storage
5. Check that extracted data populates the chat interface

### Task 9.4: Test Payment Integration
**Prompt:** "Test Stripe payment processing with test cards"**

**Test Cards:**
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **Authentication**: 4000 0025 0000 3155
- **3D Secure**: 4000 0025 0000 3155

**Test Scenarios:**
1. Free appeal (should not require payment)
2. Additional appeal (£5 payment)
3. Vehicle change (£3 payment)
4. Payment failure handling

### Task 9.5: Test Dashboard Functionality
**Prompt:** "Test complete dashboard workflow"**

**Test Steps:**
1. Create multiple appeals with different statuses
2. Test status updates (successful/unsuccessful)
3. Verify usage statistics update correctly
4. Test financial tracking (savings, ticket values)
5. Test monthly reset functionality
6. Verify appeals are organized by number plate

### Task 9.6: Test End-to-End User Journey
**Prompt:** "Test complete user journey from signup to successful appeal"**

**Complete Flow:**
1. **Signup** → Create account with email/password
2. **Login** → Access dashboard
3. **Upload PCN** → Take photo of ticket
4. **Generate Appeal** → Use AI to create appeal letter
5. **Save Appeal** → Use free appeal or pay for additional
6. **Track Progress** → Update status when response received
7. **View Stats** → Check savings and success rate

**Expected Results:**
- All steps should work seamlessly
- Data should persist across sessions
- Payments should be processed correctly
- Dashboard should show accurate statistics

---

## Phase 10: Production Deployment

### Task 10.1: Environment Setup
**Prompt:** "Configure production environment variables and deploy to Vercel using Supabase CLI"**

**Commands to run:**
```bash
# Link to your Supabase project (if not already linked)
supabase link --project-ref your-project-ref

# Get your project URL and keys
supabase status

# Set up environment variables in your deployment platform
```

**Required Environment Variables:**
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_api_key
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

### Task 10.2: Database Migration
**Prompt:** "Run database migrations in production Supabase instance"**

**Commands:**
```bash
# Apply migrations to local development
supabase db reset

# Apply migrations to production
supabase db push

# Verify tables created
supabase db diff

# Check migration status
supabase migration list
```

### Task 10.3: Final Testing
**Prompt:** "Perform end-to-end testing of the complete system in production"**

**Test Checklist:**
- [ ] User registration and login
- [ ] OpenAI chat functionality
- [ ] Appeal creation and saving
- [ ] Payment processing
- [ ] Dashboard functionality
- [ ] Status updates
- [ ] Mobile responsiveness

---

## Success Criteria

✅ **OpenAI Integration** - ChatGPT-powered appeal generation  
✅ **User Authentication** - Secure login/signup with Supabase  
✅ **Dashboard System** - Appeals organized by number plate  
✅ **Photo Upload & OCR** - OpenAI Vision automatic PCN ticket scanning  
✅ **Free Appeal System** - 1 free appeal per month per user  
✅ **Payment Processing** - £5 per additional appeal, £10 per additional vehicle  
✅ **Stripe Customer Linking** - Easy dashboard management with customer IDs  
✅ **Vehicle Management** - Users can add multiple vehicles (first free, then £10 each)  
✅ **Usage Tracking** - Monthly usage limits and reset tracking  
✅ **Status Tracking** - Success/failure tracking for appeals  
✅ **Financial Dashboard** - Shows total savings and ticket values  
✅ **Mobile Responsive** - Works on all devices  
✅ **Production Ready** - Deployed and tested  

---

## Notes

- **Pricing Model:**
  - 1 free appeal per month per user
  - £5 per additional appeal after free allowance
  - First vehicle is free, additional vehicles cost £3 each
- **OCR Integration:** OpenAI Vision API for automatic PCN ticket scanning
- **Usage Tracking:** Monthly limits reset automatically
- **All appeals are saved with proper user association**
- **RLS policies ensure data security**
- **OpenAI integration provides professional appeal letters**
- **Stripe handles secure payment processing**
- **Photo upload with drag-and-drop functionality**
- **Automatic data extraction from PCN images**

This implementation provides a complete PCN appeals system with AI assistance, photo scanning, user management, usage tracking, and flexible payment processing.

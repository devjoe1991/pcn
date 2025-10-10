import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const type = searchParams.get('type');

    if (!token || !type) {
      return NextResponse.redirect(new URL('/auth?error=missing-parameters', request.url));
    }

    // Verify the token with Supabase
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: type as 'signup' | 'recovery' | 'email_change' | 'phone_change',
    });

    if (error) {
      console.error('Token verification error:', error);
      return NextResponse.redirect(new URL('/auth?error=invalid-token', request.url));
    }

    if (!data.user) {
      return NextResponse.redirect(new URL('/auth?error=user-not-found', request.url));
    }

    // Handle different confirmation types
    switch (type) {
      case 'signup':
        // User successfully confirmed their email
        return NextResponse.redirect(new URL('/auth?message=email-confirmed&type=signup', request.url));
      
      case 'recovery':
        // User clicked password reset link
        return NextResponse.redirect(new URL('/auth?message=password-reset&type=recovery', request.url));
      
      case 'email_change':
        // User confirmed email change
        return NextResponse.redirect(new URL('/auth?message=email-changed&type=email_change', request.url));
      
      default:
        return NextResponse.redirect(new URL('/auth?message=confirmed', request.url));
    }

  } catch (error) {
    console.error('Confirmation error:', error);
    return NextResponse.redirect(new URL('/auth?error=confirmation-failed', request.url));
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token, type, email } = await request.json();

    if (!token || !type || !email) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Verify the token with Supabase
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: type as 'signup' | 'recovery' | 'email_change' | 'phone_change',
    });

    if (error) {
      console.error('Token verification error:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    if (!data.user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      user: data.user,
      message: 'Email confirmed successfully' 
    });

  } catch (error) {
    console.error('Confirmation error:', error);
    return NextResponse.json({ error: 'Confirmation failed' }, { status: 500 });
  }
}

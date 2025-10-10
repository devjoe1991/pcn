import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailPayload {
  email: string
  token: string
  type: 'signup' | 'recovery' | 'email_change'
  redirect_to?: string
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, token, type, redirect_to } = await req.json() as EmailPayload

    if (!email || !token || !type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not set')
    }

    // Generate confirmation URL
    const baseUrl = redirect_to || `${SUPABASE_URL}/auth/v1/verify`
    const confirmationUrl = `${baseUrl}?token=${token}&type=${type}`

    // Create email template based on type
    const emailTemplate = createEmailTemplate(type, confirmationUrl, email)

    // Send email via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Appeal Your PCN <noreply@appealyourpcn.com>',
        to: [email],
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      }),
    })

    if (!resendResponse.ok) {
      const errorData = await resendResponse.json()
      console.error('Resend API error:', errorData)
      throw new Error(`Failed to send email: ${errorData.message || 'Unknown error'}`)
    }

    const result = await resendResponse.json()
    console.log('Email sent successfully:', result.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: result.id,
        message: 'Confirmation email sent successfully' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error sending confirmation email:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send confirmation email',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

function createEmailTemplate(type: string, confirmationUrl: string, email: string) {
  const baseUrl = 'https://appealyourpcn.com'
  
  if (type === 'signup') {
    return {
      subject: '🔓 Confirm Your Appeal Your PCN Account',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Confirm Your Account - Appeal Your PCN</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
            .header p { margin: 10px 0 0; opacity: 0.9; font-size: 16px; }
            .content { padding: 40px 30px; }
            .content h2 { color: #1f2937; margin: 0 0 20px; font-size: 24px; }
            .content p { margin: 0 0 20px; font-size: 16px; color: #4b5563; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; }
            .cta-button:hover { opacity: 0.9; }
            .features { background: #f8fafc; padding: 30px; margin: 30px 0; border-radius: 8px; }
            .features h3 { color: #1f2937; margin: 0 0 15px; font-size: 18px; }
            .features ul { margin: 0; padding-left: 20px; }
            .features li { margin: 8px 0; color: #4b5563; }
            .footer { background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; }
            .footer p { margin: 0; color: #6b7280; font-size: 14px; }
            .logo { font-size: 32px; font-weight: 800; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🎯 Appeal Your PCN</div>
              <h1>Welcome to Appeal Your PCN!</h1>
              <p>Your AI-powered compliance expert is ready to help you win your PCN appeals</p>
            </div>
            
            <div class="content">
              <h2>🔓 Confirm Your Account</h2>
              <p>Hi there!</p>
              <p>Thanks for signing up with Appeal Your PCN! We're excited to help you fight unfair parking tickets with our AI-powered compliance analysis.</p>
              
              <p>To get started, please confirm your email address by clicking the button below:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${confirmationUrl}" class="cta-button">🔓 Confirm My Account</a>
              </div>
              
              <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #f3f4f6; padding: 15px; border-radius: 6px; font-family: monospace; font-size: 14px;">${confirmationUrl}</p>
              
              <div class="features">
                <h3>🎯 What you'll get with your account:</h3>
                <ul>
                  <li><strong>First appeal FREE</strong> - Get your first professional appeal letter at no cost</li>
                  <li><strong>AI-powered analysis</strong> - Find legal loopholes and compliance issues</li>
                  <li><strong>Professional appeal letters</strong> - Tailored to your specific case</li>
                  <li><strong>Success tracking</strong> - Monitor your appeals in your dashboard</li>
                  <li><strong>Monthly free appeals</strong> - Get more free appeals each month</li>
                </ul>
              </div>
              
              <p>Once confirmed, you'll be able to:</p>
              <ul>
                <li>Upload your PCN ticket for instant analysis</li>
                <li>Get your first appeal letter completely FREE</li>
                <li>Track all your appeals in one place</li>
                <li>Access our AI compliance expert 24/7</li>
              </ul>
              
              <p>This confirmation link will expire in 24 hours for security reasons.</p>
            </div>
            
            <div class="footer">
              <p>© 2024 Appeal Your PCN. All rights reserved.</p>
              <p>This email was sent to ${email}. If you didn't sign up for an account, you can safely ignore this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome to Appeal Your PCN!
        
        Hi there!
        
        Thanks for signing up with Appeal Your PCN! We're excited to help you fight unfair parking tickets with our AI-powered compliance analysis.
        
        To confirm your account, please click this link:
        ${confirmationUrl}
        
        What you'll get with your account:
        - First appeal FREE - Get your first professional appeal letter at no cost
        - AI-powered analysis - Find legal loopholes and compliance issues  
        - Professional appeal letters - Tailored to your specific case
        - Success tracking - Monitor your appeals in your dashboard
        - Monthly free appeals - Get more free appeals each month
        
        Once confirmed, you'll be able to:
        - Upload your PCN ticket for instant analysis
        - Get your first appeal letter completely FREE
        - Track all your appeals in one place
        - Access our AI compliance expert 24/7
        
        This confirmation link will expire in 24 hours for security reasons.
        
        © 2024 Appeal Your PCN. All rights reserved.
        This email was sent to ${email}. If you didn't sign up for an account, you can safely ignore this email.
      `
    }
  }

  if (type === 'recovery') {
    return {
      subject: '🔑 Reset Your Appeal Your PCN Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password - Appeal Your PCN</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 40px 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
            .header p { margin: 10px 0 0; opacity: 0.9; font-size: 16px; }
            .content { padding: 40px 30px; }
            .content h2 { color: #1f2937; margin: 0 0 20px; font-size: 24px; }
            .content p { margin: 0 0 20px; font-size: 16px; color: #4b5563; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; }
            .cta-button:hover { opacity: 0.9; }
            .footer { background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; }
            .footer p { margin: 0; color: #6b7280; font-size: 14px; }
            .logo { font-size: 32px; font-weight: 800; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🎯 Appeal Your PCN</div>
              <h1>Password Reset Request</h1>
              <p>We received a request to reset your password</p>
            </div>
            
            <div class="content">
              <h2>🔑 Reset Your Password</h2>
              <p>Hi there!</p>
              <p>We received a request to reset the password for your Appeal Your PCN account.</p>
              
              <p>To reset your password, please click the button below:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${confirmationUrl}" class="cta-button">🔑 Reset My Password</a>
              </div>
              
              <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #f3f4f6; padding: 15px; border-radius: 6px; font-family: monospace; font-size: 14px;">${confirmationUrl}</p>
              
              <p><strong>Security Note:</strong> This password reset link will expire in 1 hour for security reasons. If you didn't request this password reset, you can safely ignore this email.</p>
            </div>
            
            <div class="footer">
              <p>© 2024 Appeal Your PCN. All rights reserved.</p>
              <p>This email was sent to ${email}. If you didn't request a password reset, you can safely ignore this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Password Reset Request - Appeal Your PCN
        
        Hi there!
        
        We received a request to reset the password for your Appeal Your PCN account.
        
        To reset your password, please click this link:
        ${confirmationUrl}
        
        Security Note: This password reset link will expire in 1 hour for security reasons. If you didn't request this password reset, you can safely ignore this email.
        
        © 2024 Appeal Your PCN. All rights reserved.
        This email was sent to ${email}. If you didn't request a password reset, you can safely ignore this email.
      `
    }
  }

  // Default email change template
  return {
    subject: '📧 Confirm Your New Email Address',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirm Email Change - Appeal Your PCN</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
          .header p { margin: 10px 0 0; opacity: 0.9; font-size: 16px; }
          .content { padding: 40px 30px; }
          .content h2 { color: #1f2937; margin: 0 0 20px; font-size: 24px; }
          .content p { margin: 0 0 20px; font-size: 16px; color: #4b5563; }
          .cta-button { display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; }
          .cta-button:hover { opacity: 0.9; }
          .footer { background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; }
          .footer p { margin: 0; color: #6b7280; font-size: 14px; }
          .logo { font-size: 32px; font-weight: 800; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🎯 Appeal Your PCN</div>
            <h1>Confirm Email Change</h1>
            <p>Please confirm your new email address</p>
          </div>
          
          <div class="content">
            <h2>📧 Confirm Your New Email</h2>
            <p>Hi there!</p>
            <p>We received a request to change the email address for your Appeal Your PCN account to ${email}.</p>
            
            <p>To confirm this change, please click the button below:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmationUrl}" class="cta-button">📧 Confirm Email Change</a>
            </div>
            
            <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #f3f4f6; padding: 15px; border-radius: 6px; font-family: monospace; font-size: 14px;">${confirmationUrl}</p>
            
            <p><strong>Security Note:</strong> This confirmation link will expire in 24 hours for security reasons. If you didn't request this email change, please contact our support team immediately.</p>
          </div>
          
          <div class="footer">
            <p>© 2024 Appeal Your PCN. All rights reserved.</p>
            <p>This email was sent to ${email}. If you didn't request this email change, please contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Confirm Email Change - Appeal Your PCN
      
      Hi there!
      
      We received a request to change the email address for your Appeal Your PCN account to ${email}.
      
      To confirm this change, please click this link:
      ${confirmationUrl}
      
      Security Note: This confirmation link will expire in 24 hours for security reasons. If you didn't request this email change, please contact our support team immediately.
      
      © 2024 Appeal Your PCN. All rights reserved.
      This email was sent to ${email}. If you didn't request this email change, please contact our support team.
    `
  }
}

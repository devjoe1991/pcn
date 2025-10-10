#!/bin/bash

# Setup Email Confirmation with Supabase Edge Functions
# This script configures the email confirmation system with Resend integration

echo "🎯 Setting up Appeal Your PCN Email Confirmation System"
echo "=================================================="

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if user is logged in
if ! supabase projects list &> /dev/null; then
    echo "❌ Please login to Supabase first:"
    echo "   supabase login"
    exit 1
fi

echo "✅ Supabase CLI is ready"

# Deploy the edge function
echo "📦 Deploying email confirmation edge function..."
supabase functions deploy send-confirmation-email

if [ $? -eq 0 ]; then
    echo "✅ Edge function deployed successfully"
else
    echo "❌ Failed to deploy edge function"
    exit 1
fi

# Get project URL
PROJECT_URL=$(supabase status | grep "API URL" | awk '{print $3}')
echo "🔗 Project URL: $PROJECT_URL"

# Create environment variables file
echo "📝 Creating environment variables template..."
cat > supabase/.env << EOF
# Resend API Key - Get from https://resend.com/api-keys
RESEND_API_KEY=your_resend_api_key_here

# Supabase Configuration
SUPABASE_URL=$PROJECT_URL
SUPABASE_ANON_KEY=your_supabase_anon_key

# Email Configuration
FROM_EMAIL=noreply@appealyourpcn.com
FROM_NAME=Appeal Your PCN

# Site Configuration
SITE_URL=https://appealyourpcn.com
EOF

echo "✅ Environment variables template created"

echo ""
echo "🎯 Next Steps:"
echo "=============="
echo ""
echo "1. Get your Resend API key from https://resend.com/api-keys"
echo "2. Set environment variables in Supabase Dashboard:"
echo "   - Go to Settings > Edge Functions > Environment Variables"
echo "   - Add RESEND_API_KEY with your Resend API key"
echo ""
echo "3. Configure email templates in Supabase Dashboard:"
echo "   - Go to Authentication > Settings"
echo "   - Set Site URL to: https://appealyourpcn.com"
echo "   - Add Redirect URL: https://appealyourpcn.com/auth/callback"
echo "   - In Email Templates, set custom SMTP for each template:"
echo "     - Host: $PROJECT_URL/functions/v1/send-confirmation-email"
echo "     - Method: POST"
echo "     - Headers: Authorization: Bearer YOUR_ANON_KEY"
echo ""
echo "4. Test the setup:"
echo "   supabase functions serve send-confirmation-email"
echo ""
echo "🎉 Email confirmation system is ready!"
echo ""
echo "📧 Email Features:"
echo "  - Professional branding for Appeal Your PCN"
echo "  - Responsive HTML templates"
echo "  - Signup confirmation emails"
echo "  - Password reset emails"
echo "  - Email change confirmation"
echo "  - Security features (expiring links)"
echo ""
echo "🔧 Troubleshooting:"
echo "  - Check function logs: supabase functions logs send-confirmation-email"
echo "  - Test locally: supabase functions serve send-confirmation-email"
echo "  - Verify Resend domain: https://resend.com/domains"

# Deploy Email Confirmation Edge Function

## Prerequisites

1. **Resend Account Setup:**
   - Sign up at https://resend.com
   - Get your API key from https://resend.com/api-keys
   - Verify your domain `appealyourpcn.com` in Resend dashboard

2. **Supabase CLI Setup:**
   ```bash
   npm install -g supabase
   supabase login
   ```

## Deployment Steps

### 1. Set Environment Variables

Set the following environment variables in your Supabase project:

```bash
# In Supabase Dashboard > Settings > Edge Functions > Environment Variables
RESEND_API_KEY=your_resend_api_key_here
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Deploy the Edge Function

```bash
# Deploy the function
supabase functions deploy send-confirmation-email

# Set the function URL as your email template
supabase functions serve send-confirmation-email
```

### 3. Configure Supabase Auth

In your Supabase Dashboard:

1. Go to **Authentication > Settings**
2. Set **Site URL** to: `https://appealyourpcn.com`
3. Add **Redirect URLs**: `https://appealyourpcn.com/auth/callback`
4. In **Email Templates**, set:
   - **Confirm signup**: Use custom template
   - **Reset password**: Use custom template
   - **Email change**: Use custom template

### 4. Update Email Templates

For each email template, set the **Custom SMTP** settings:

- **Host**: Use the edge function URL
- **Method**: POST
- **URL**: `https://your-project.supabase.co/functions/v1/send-confirmation-email`
- **Headers**: 
  ```json
  {
    "Authorization": "Bearer YOUR_SUPABASE_ANON_KEY",
    "Content-Type": "application/json"
  }
  ```

### 5. Test the Setup

```bash
# Test locally
supabase functions serve send-confirmation-email --env-file supabase/.env

# Test with curl
curl -X POST http://localhost:54321/functions/v1/send-confirmation-email \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "token": "test-token",
    "type": "signup"
  }'
```

## Email Templates

The function supports three email types:

1. **Signup Confirmation** (`type: "signup"`)
2. **Password Reset** (`type: "recovery"`)
3. **Email Change** (`type: "email_change"`)

Each template includes:
- Professional branding for "Appeal Your PCN"
- Responsive HTML design
- Clear call-to-action buttons
- Security information
- Fallback text version

## Troubleshooting

### Common Issues:

1. **Resend API Key Invalid:**
   - Verify your API key in Resend dashboard
   - Check domain verification status

2. **Function Not Deployed:**
   - Run `supabase functions deploy send-confirmation-email`
   - Check function logs in Supabase dashboard

3. **Email Not Sending:**
   - Verify environment variables are set
   - Check function logs for errors
   - Test with curl command above

### Debug Commands:

```bash
# Check function logs
supabase functions logs send-confirmation-email

# Test function locally
supabase functions serve send-confirmation-email --debug
```

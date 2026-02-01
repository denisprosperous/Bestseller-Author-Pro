# Admin Credentials - Bestseller Author Pro

## Admin Account Details

### Primary Admin Account
**Email**: `admin@bestsellerauthorpro.com`
**Password**: `Admin@2026!Secure`

### Test Admin Account
**Email**: `test@bestsellerauthorpro.com`
**Password**: `Test@2026!Secure`

## How to Create Admin Account

Since we're using Supabase authentication, you need to create the account through the signup flow:

### Option 1: Use the Signup Form (Recommended)
1. Go to http://localhost:5173/login
2. Click "Sign Up"
3. Enter email: `admin@bestsellerauthorpro.com`
4. Enter password: `Admin@2026!Secure`
5. Click "Create Account"
6. Check email for verification link (if email confirmation is enabled)
7. Click verification link
8. Login with the credentials

### Option 2: Create Directly in Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to Authentication → Users
3. Click "Add User"
4. Enter email: `admin@bestsellerauthorpro.com`
5. Enter password: `Admin@2026!Secure`
6. Check "Auto Confirm User" (to skip email verification)
7. Click "Create User"
8. Now you can login with these credentials

### Option 3: Use Supabase SQL Editor
```sql
-- Create admin user directly in database
-- Note: This bypasses Supabase Auth, use Option 1 or 2 instead
-- This is just for reference

-- First, create the user through Supabase Auth UI or signup form
-- Then you can query to verify:
SELECT * FROM auth.users WHERE email = 'admin@bestsellerauthorpro.com';
```

## Testing Login/Signup Workflow

### Test Signup Flow
1. Go to http://localhost:5173/login
2. Click "Sign Up" button
3. Enter a test email (e.g., `yourname@example.com`)
4. Enter a password (minimum 6 characters)
5. Click "Create Account"
6. Should see success message: "Account created successfully! Please check your email to verify your account."
7. Check Supabase dashboard → Authentication → Users to see the new user

### Test Login Flow
1. Go to http://localhost:5173/login
2. Enter email: `admin@bestsellerauthorpro.com`
3. Enter password: `Admin@2026!Secure`
4. Click "Sign In"
5. Should redirect to home page (http://localhost:5173/)
6. Should see user email in navigation bar
7. Should be able to access all protected routes

### Test Logout Flow
1. After logging in, click "Logout" in navigation
2. Should redirect to login page
3. Should not be able to access protected routes
4. Trying to access protected routes should redirect to login

### Test Forgot Password Flow
1. Go to http://localhost:5173/login
2. Click "Forgot your password?"
3. Enter email address
4. Click "Send Reset Link"
5. Check email for password reset link
6. Click link and enter new password
7. Login with new password

## Password Requirements

- Minimum 6 characters
- Recommended: Mix of uppercase, lowercase, numbers, and special characters
- Example strong passwords:
  - `Admin@2026!Secure`
  - `Test@2026!Secure`
  - `MySecure#Pass123`

## Security Notes

### For Development
- These credentials are for development/testing only
- Change passwords before production deployment
- Enable email verification in Supabase for production

### For Production
1. **Change Default Passwords**: Never use these credentials in production
2. **Enable Email Verification**: Require users to verify email
3. **Enable 2FA**: Add two-factor authentication
4. **Use Strong Passwords**: Enforce password complexity rules
5. **Monitor Auth Logs**: Check Supabase Auth logs regularly
6. **Set Up Rate Limiting**: Prevent brute force attacks
7. **Use Environment Variables**: Store sensitive data in .env

## Supabase Configuration

### Email Settings (Optional)
If you want email verification to work:

1. Go to Supabase Dashboard → Authentication → Email Templates
2. Configure SMTP settings or use Supabase's email service
3. Customize email templates
4. Enable "Confirm email" in Auth settings

### Auth Settings
1. Go to Supabase Dashboard → Authentication → Settings
2. Configure:
   - **Site URL**: http://localhost:5173 (for development)
   - **Redirect URLs**: http://localhost:5173/*, http://localhost:5173/reset-password
   - **Email Confirmation**: Enable/Disable based on preference
   - **Password Requirements**: Minimum 6 characters (default)

## Troubleshooting

### Issue: "Invalid login credentials"
**Solution**: 
- Verify email and password are correct
- Check if user exists in Supabase dashboard
- Ensure user is confirmed (if email verification is enabled)
- Check Supabase Auth logs for errors

### Issue: "Email not confirmed"
**Solution**:
- Check email for verification link
- Or manually confirm user in Supabase dashboard
- Or disable email confirmation in Supabase settings

### Issue: "User already registered"
**Solution**:
- Use the login form instead of signup
- Or use a different email address
- Or delete the existing user in Supabase dashboard

### Issue: Can't access protected routes after login
**Solution**:
- Check browser console for errors
- Verify Supabase session is created
- Check if `AuthService.getCurrentUser()` returns user
- Clear browser cache and try again

## API Keys Setup After Login

After successfully logging in, you need to add your AI provider API keys:

1. Go to Settings (http://localhost:5173/settings)
2. Add your API keys for:
   - OpenAI (for GPT models)
   - Anthropic (for Claude models)
   - Google (for Gemini models)
   - xAI (for Grok models)
   - DeepSeek (for DeepSeek models)
3. Keys are saved to localStorage
4. Now you can use Brainstorm, Builder, and other features

## Quick Start After Login

1. **Login** with admin credentials
2. **Go to Settings** and add at least one AI provider API key
3. **Go to Brainstorm** and generate book ideas
4. **Go to Builder** and create your first ebook
5. **Go to Preview** to see your generated content
6. **Export** your ebook in multiple formats

## Support

If you encounter any issues:
1. Check browser console for errors
2. Check Supabase dashboard → Authentication → Logs
3. Verify .env file has correct Supabase credentials
4. Ensure database schema is applied
5. Try clearing browser cache and localStorage

## Status: Ready for Testing ✅

The login/signup pages now show:
- ✅ App name: "Bestseller Author Pro"
- ✅ Tagline: "AI-Powered Content Creation Platform"
- ✅ Clear descriptions for both login and signup
- ✅ Professional branding

Use the admin credentials above to test the authentication workflow!

# Supabase Setup Guide

This guide walks you through setting up Supabase for the Cin7 Pendo Analytics Dashboard.

## Prerequisites

- Supabase account with project created
- Project URL: `https://nrutlzclujyejusvbafm.supabase.co`
- Google account: `cin7pendo@gmail.com`

## Step 1: Configure Google OAuth

### 1.1 Set up Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with `cin7pendo@gmail.com`
3. Create a new project or select existing project
4. Navigate to **APIs & Services** → **Credentials**
5. Click **Create Credentials** → **OAuth 2.0 Client ID**
6. Configure OAuth consent screen if not already done:
   - User Type: **Internal** (for Workspace) or **External**
   - App name: **Cin7 Pendo Analytics**
   - User support email: `cin7pendo@gmail.com`
   - Developer contact: `cin7pendo@gmail.com`
7. Create OAuth 2.0 Client ID:
   - Application type: **Web application**
   - Name: **Cin7 Pendo Analytics**
   - Authorized JavaScript origins:
     - `http://localhost:5173` (for development)
     - `https://nrutlzclujyejusvbafm.supabase.co`
     - Your production domain
   - Authorized redirect URIs:
     - `http://localhost:5173/auth/callback`
     - `https://nrutlzclujyejusvbafm.supabase.co/auth/v1/callback`
     - Your production domain + `/auth/callback`
8. Save the **Client ID** and **Client Secret**

### 1.2 Configure Supabase Authentication

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Providers**
3. Find **Google** in the list and click to configure
4. Enable Google provider
5. Enter the **Client ID** and **Client Secret** from Google Cloud Console
6. In **Authorized redirect URLs**, add:
   - `https://nrutlzclujyejusvbafm.supabase.co/auth/v1/callback`
7. Save the configuration

### 1.3 Restrict to @cin7.com Domain

The authentication is configured to only allow @cin7.com email addresses:
- Frontend validates the email domain in `AuthContext.tsx`
- Automatic sign-out if email doesn't end with `@cin7.com`
- Google OAuth configured with `hd: 'cin7.com'` parameter

## Step 2: Create Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Create a new query
3. Copy and paste the contents of `supabase-schema.sql`
4. Run the query to create all tables, indexes, policies, and functions

### Tables Created:
- `pendo_guides` - Guide metadata and analytics
- `pendo_features` - Feature usage data
- `pendo_pages` - Page view analytics
- `pendo_events` - Raw event data
- `sync_status` - Data sync tracking

### Row Level Security (RLS):
All tables have RLS enabled with policies that only allow:
- Authenticated users
- With email addresses ending in `@cin7.com`

## Step 3: Verify Environment Variables

Ensure your `.env` file has the correct Supabase configuration:

```env
VITE_SUPABASE_URL=https://nrutlzclujyejusvbafm.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ydXRsemNsdWp5ZWp1c3ZiYWZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MTM4MTAsImV4cCI6MjA3Nzk4OTgxMH0.wailzK_IBHtUig3sdragy-WVcyZDxrQEQaCt76AD130
```

## Step 4: Backend Sync Service

### Option A: Supabase Edge Functions (Recommended)

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Initialize Supabase in your project:
   ```bash
   supabase init
   ```

3. Create a new Edge Function:
   ```bash
   supabase functions new sync-pendo-data
   ```

4. Deploy the function:
   ```bash
   supabase functions deploy sync-pendo-data --project-ref nrutlzclujyejusvbafm
   ```

5. Set environment variables in Supabase dashboard:
   - Go to **Edge Functions** → **Settings**
   - Add secrets:
     - `PENDO_API_KEY`: Your Pendo API key
     - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key

6. Set up a cron job to run the sync:
   - Use Supabase's built-in cron or external service (GitHub Actions, etc.)

### Option B: Separate Backend Service

1. Create a Node.js/Python backend service
2. Install dependencies:
   ```bash
   npm install @supabase/supabase-js axios
   ```

3. Configure environment variables:
   ```env
   SUPABASE_URL=https://nrutlzclujyejusvbafm.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
   PENDO_API_KEY=<pendo-api-key>
   DATABASE_URL=postgresql://postgres:mfAKsHn0kljPqvkf@db.nrutlzclujyejusvbafm.supabase.co:5432/postgres
   ```

4. Implement data fetching from Pendo and insertion into Supabase
5. Deploy to a hosting service (Render, Railway, etc.)
6. Set up cron job for scheduled syncs

## Step 5: Testing

### Test Authentication:

1. Start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```

2. Open browser to `http://localhost:5173`
3. You should be redirected to `/login`
4. Click "Sign in with Google"
5. Use a `@cin7.com` email address
6. After successful authentication, you should be redirected to `/dashboard`

### Test Database Access:

1. Go to Supabase dashboard → **Table Editor**
2. Check that all tables are created
3. Try inserting test data
4. Verify RLS policies work correctly

### Test API Endpoints:

Once the backend sync service is running:
1. Manually trigger a sync
2. Check Supabase tables for data
3. Verify frontend can query the data
4. Check that sparklines and charts display correctly

## Step 6: Production Deployment

1. Update `.env` with production Supabase URL
2. Deploy frontend to your hosting service
3. Update Google OAuth redirect URIs with production domain
4. Set up production cron job for data sync
5. Monitor logs for errors

## Troubleshooting

### Authentication Issues:
- Check that Google OAuth is properly configured
- Verify redirect URIs match exactly
- Check browser console for errors
- Ensure `@cin7.com` domain restriction is working

### Database Issues:
- Verify RLS policies are correct
- Check that user is authenticated
- Ensure email domain matches policy

### Sync Issues:
- Check Edge Function logs
- Verify Pendo API key is valid
- Check rate limits
- Monitor database for data updates

## Security Notes

1. **Never commit sensitive keys** to version control
2. Use **environment variables** for all credentials
3. **Service Role Key** should only be used server-side
4. **Anon Key** is safe for client-side use with RLS
5. All database access is protected by **Row Level Security**
6. Only `@cin7.com` emails can access the dashboard

## Support

For issues or questions:
1. Check Supabase logs
2. Check browser console
3. Review this guide
4. Contact IT administrator

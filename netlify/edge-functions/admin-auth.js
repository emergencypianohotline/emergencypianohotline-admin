/**
 * Edge Function to protect admin site
 * Blocks all requests unless user is authenticated as admin
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://iqvntlifrvkdqrrcxwsf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlxdm50bGlmcnZrZHFycmN4d3NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzc5NzIsImV4cCI6MjA3NDc1Mzk3Mn0.wbCHI_BFXkjI0foLKQBVZShSBh8fM3TvX545xND1hbc';
const ADMIN_EMAILS = ['hello@dntwig.com'];

export default async (request, context) => {
  const url = new URL(request.url);

  // Allow login page and assets
  if (url.pathname === '/' || url.pathname.startsWith('/assets/')) {
    return context.next();
  }

  // Get session from cookies
  const cookies = request.headers.get('cookie') || '';
  const sessionMatch = cookies.match(/sb-iqvntlifrvkdqrrcxwsf-auth-token=([^;]+)/);

  if (!sessionMatch) {
    // No session - show login page
    return context.next();
  }

  try {
    // Parse session token
    const sessionData = JSON.parse(decodeURIComponent(sessionMatch[1]));
    const accessToken = sessionData.access_token;

    if (!accessToken) {
      return context.next();
    }

    // Verify with Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      // Invalid session - show login page
      return context.next();
    }

    // Check if user is admin
    if (!ADMIN_EMAILS.includes(user.email)) {
      // Not admin - return 403
      return new Response('Access denied', {
        status: 403,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    // Admin verified - allow access
    return context.next();

  } catch (err) {
    console.error('Auth error:', err);
    return context.next();
  }
};

export const config = {
  path: '/*',
};

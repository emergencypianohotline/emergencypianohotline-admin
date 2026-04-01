/**
 * Edge Function to protect admin site
 * Blocks all requests unless user is authenticated as admin
 * Also handles SPA routing by serving index.html for all non-asset paths
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://iqvntlifrvkdqrrcxwsf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlxdm50bGlmcnZrZHFycmN4d3NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzc5NzIsImV4cCI6MjA3NDc1Mzk3Mn0.wbCHI_BFXkjI0foLKQBVZShSBh8fM3TvX545xND1hbc';
const ADMIN_EMAILS = ['hello@dntwig.com'];

// Check if path is a static asset (has a file extension)
function isStaticAsset(pathname) {
  return pathname.startsWith('/assets/') || /\.\w+$/.test(pathname);
}

export default async (request, context) => {
  const url = new URL(request.url);

  // Static assets and index.html pass through directly to CDN
  if (url.pathname === '/' || isStaticAsset(url.pathname)) {
    return context.next();
  }

  // Fetch index.html directly — edge function passes .html files through as static assets, no loop
  const serveIndex = () => fetch(new URL('/index.html', request.url).toString());

  // Get session from cookies
  const cookies = request.headers.get('cookie') || '';
  const sessionMatch = cookies.match(/sb-iqvntlifrvkdqrrcxwsf-auth-token=([^;]+)/);

  if (!sessionMatch) {
    // No session - serve index.html (login page)
    return serveIndex();
  }

  try {
    // Parse session token
    const sessionData = JSON.parse(decodeURIComponent(sessionMatch[1]));
    const accessToken = sessionData.access_token;

    if (!accessToken) {
      return serveIndex();
    }

    // Verify with Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return serveIndex();
    }

    // Check if user is admin
    if (!ADMIN_EMAILS.includes(user.email)) {
      return new Response('Access denied', {
        status: 403,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    // Admin verified - serve index.html for SPA routing
    return serveIndex();

  } catch (err) {
    console.error('Auth error:', err);
    return serveIndex();
  }
};

// Edge function disabled — SPA routing handled by [[redirects]] in netlify.toml
// export const config = { path: '/*' };

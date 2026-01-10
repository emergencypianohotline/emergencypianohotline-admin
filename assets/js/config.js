/**
 * Admin Site Configuration
 */

// Debug mode
export const DEBUG = true;

// Supabase configuration
export const SUPABASE_URL = 'https://iqvntlifrvkdqrrcxwsf.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlxdm50bGlmcnZrZHFycmN4d3NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI5ODI4ODgsImV4cCI6MjA0ODU1ODg4OH0.VoCWNjqBN6pHVIEcdYqUjPvG0gaCxC6jz_bz8DLwPHA';

// Debug logger
export const debug = {
  log: (...args) => {
    if (DEBUG) console.log(...args);
  },
  warn: (...args) => {
    if (DEBUG) console.warn(...args);
  },
  error: (...args) => {
    console.error(...args);
  },
};

// Initialize Supabase client globally
if (!window.HOTLINE) window.HOTLINE = {};
window.HOTLINE.supabase = {
  supabaseUrl: SUPABASE_URL,
  supabaseAnonKey: SUPABASE_ANON_KEY,
};

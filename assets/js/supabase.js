/**
 * @fileoverview Supabase API abstraction layer
 *
 * Centralizes all Supabase queries with consistent error handling,
 * type safety, and caching strategies.
 */

import { getSupabase, getUserId, getState } from '../core/store.js';
import { logError, ErrorSeverity } from '../core/error-handler.js';
import { debug } from '../config.js';

/**
 * @typedef {Object} UserProfile
 * @property {string} id
 * @property {string} email
 * @property {string} first_name
 * @property {string} outseta_id
 * @property {string} created_at
 */

/**
 * @typedef {Object} TutorialProgress
 * @property {string} user_id
 * @property {string} tutorial_id
 * @property {boolean} completed
 * @property {number} progress_percent
 * @property {string} last_watched_at
 */

/**
 * Handle Supabase errors consistently
 * @param {Object} error - Supabase error object
 * @param {string} action - Action being performed
 * @throws {Error}
 */
function handleSupabaseError(error, action) {
  const errorData = {
    module: 'api/supabase',
    action,
    metadata: { error },
  };

  logError(error, errorData, ErrorSeverity.ERROR);
  throw new Error(`${action} failed: ${error.message || 'Unknown error'}`);
}

/**
 * Ensure Supabase client is available
 * @throws {Error}
 */
function ensureSupabase() {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }
  return supabase;
}

// ============================================================
// USER API
// ============================================================

/**
 * Get current user profile
 * @returns {Promise<UserProfile|null>}
 */
export async function getUserProfile() {
  const supabase = ensureSupabase();
  const { user } = getState();

  if (!user) {
    throw new Error('No authenticated user');
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', user.email.trim())
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    handleSupabaseError(error, 'getUserProfile');
  }

  if (!data) {
    debug.warn('⚠️ No user profile found in users table');
  }

  return data || null;
}

/**
 * Update user profile
 * @param {Partial<UserProfile>} updates - Profile fields to update
 * @returns {Promise<UserProfile>}
 */
export async function updateUserProfile(updates) {
  const supabase = ensureSupabase();
  const userId = getUserId();

  if (!userId) {
    throw new Error('No authenticated user');
  }

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    handleSupabaseError(error, 'updateUserProfile');
  }

  return data;
}

// ============================================================
// PROGRESS API
// ============================================================

/**
 * Get user's tutorial progress
 * @param {string} [songSlug] - Optional filter by song slug
 * @returns {Promise<TutorialProgress[]>}
 */
export async function getUserProgress(songSlug = null) {
  const supabase = ensureSupabase();
  const userId = getUserId();

  if (!userId) {
    throw new Error('No authenticated user');
  }

  let query = supabase
    .from('progress')
    .select('*')
    .eq('user_id', userId);

  if (songSlug) {
    query = query.eq('song_slug', songSlug);
  }

  const { data, error } = await query;

  if (error) {
    handleSupabaseError(error, 'getUserProgress');
  }

  return data || [];
}

/**
 * Update tutorial progress
 * @param {string} tutorialId - Tutorial ID
 * @param {Object} progressData - Progress data to update
 * @returns {Promise<TutorialProgress>}
 */
export async function updateTutorialProgress(tutorialId, progressData) {
  const supabase = ensureSupabase();
  const userId = getUserId();

  if (!userId) {
    throw new Error('No authenticated user');
  }

  const { data, error } = await supabase
    .from('progress')
    .upsert(
      {
        user_id: userId,
        tutorial_id: tutorialId,
        ...progressData,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,tutorial_id' }
    )
    .select()
    .single();

  if (error) {
    handleSupabaseError(error, 'updateTutorialProgress');
  }

  debug.log(`✅ updateTutorialProgress: saved ${progressData.status} for tutorial ${tutorialId}`);
  return data;
}

/**
 * Mark tutorial as completed
 * @param {string} tutorialId - Tutorial ID
 * @returns {Promise<TutorialProgress>}
 */
export async function markTutorialComplete(tutorialId) {
  return updateTutorialProgress(tutorialId, {
    status: 'completed',
  });
}

// ============================================================
// TUTORIALS API
// ============================================================

/**
 * Get all tutorials
 * @returns {Promise<Array>}
 */
export async function getTutorials() {
  const supabase = ensureSupabase();

  const { data, error } = await supabase
    .from('tutorials_master')
    .select('*')
    .order('order', { ascending: true });

  if (error) {
    handleSupabaseError(error, 'getTutorials');
  }

  return data || [];
}

/**
 * Get tutorials for a specific song
 * @param {string} songSlug - Song slug
 * @returns {Promise<Array>}
 */
export async function getTutorialsBySong(songSlug) {
  const supabase = ensureSupabase();

  const { data, error } = await supabase
    .from('tutorials_master')
    .select('*')
    .eq('song_slug', songSlug)
    .order('order', { ascending: true });

  if (error) {
    handleSupabaseError(error, 'getTutorialsBySong');
  }

  return data || [];
}

/**
 * Get user's tutorial progress view (with computed fields)
 * @param {string} [filter='all'] - 'all', 'in_progress', or 'completed'
 * @returns {Promise<Array>}
 */
export async function getTutorialProgressView(filter = 'all') {
  const supabase = ensureSupabase();
  const userId = getUserId();

  if (!userId) {
    throw new Error('No authenticated user');
  }

  let query = supabase
    .from('tutorial_user_progress_view')
    .select('*')
    .eq('user_id', userId)
    .order('last_watched_at', { ascending: false, nullsFirst: false });

  if (filter === 'in_progress') {
    query = query.eq('completed', false).gt('progress_percent', 0);
  } else if (filter === 'completed') {
    query = query.eq('completed', true);
  }

  const { data, error } = await query;

  if (error) {
    handleSupabaseError(error, 'getTutorialProgressView');
  }

  return data || [];
}

// ============================================================
// PREFERENCES API
// ============================================================

/**
 * Get user preferences
 * @returns {Promise<Object>}
 */
export async function getUserPreferences() {
  const supabase = ensureSupabase();
  const userId = getUserId();

  if (!userId) {
    throw new Error('No authenticated user');
  }

  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No preferences found, return defaults
      return {};
    }
    handleSupabaseError(error, 'getUserPreferences');
  }

  return data?.preferences || {};
}

/**
 * Update user preferences
 * @param {Object} preferences - Preferences object
 * @returns {Promise<Object>}
 */
export async function updateUserPreferences(preferences) {
  const supabase = ensureSupabase();
  const userId = getUserId();

  if (!userId) {
    throw new Error('No authenticated user');
  }

  const { data, error } = await supabase
    .from('user_preferences')
    .upsert(
      {
        user_id: userId,
        preferences,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single();

  if (error) {
    handleSupabaseError(error, 'updateUserPreferences');
  }

  return data?.preferences || {};
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  getUserProfile,
  updateUserProfile,
  getUserProgress,
  updateTutorialProgress,
  markTutorialComplete,
  getTutorials,
  getTutorialsBySong,
  getTutorialProgressView,
  getUserPreferences,
  updateUserPreferences,
};

import { supabase } from './supabase';

// Simple in-memory storage for demo purposes
let sessionStorage = null;

// Authentication service for GarmentPOS
export const authService = {
  // Simple username/password login
  async signIn(username, password) {
    try {
      // For demo purposes, we'll use hardcoded credentials
      // In production, you would validate against Supabase Auth or your own backend
      if (username === 'admin' && password === 'admin2530') {
        // Store authentication state locally
        const session = {
          user: {
            id: 'admin',
            email: 'admin@garmentpos.com',
            user_metadata: {
              username: 'admin',
              role: 'admin',
            },
          },
          access_token: 'demo_token_' + Date.now(),
          expires_at: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        };

        // Store session in memory for React Native
        sessionStorage = session;

        return { success: true, data: session };
      } else {
        throw new Error('Invalid username or password');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  },

  // Get current session
  async getCurrentSession() {
    try {
      // Check in-memory storage for session
      if (sessionStorage) {
        // Check if session is still valid
        if (sessionStorage.expires_at > Date.now()) {
          return sessionStorage;
        } else {
          // Session expired, remove it
          sessionStorage = null;
        }
      }
      return null;
    } catch (error) {
      console.error('Get session error:', error);
      return null;
    }
  },

  // Sign out
  async signOut() {
    try {
      // Remove session from memory
      sessionStorage = null;
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  },

  // Listen to auth state changes
  onAuthStateChange(callback) {
    // For demo purposes, we'll simulate auth state changes
    // In production, you would use Supabase's auth state listener
    return {
      data: { subscription: { unsubscribe: () => {} } },
    };
  },

  // Check if user is authenticated
  async isAuthenticated() {
    try {
      const session = await this.getCurrentSession();
      return !!session;
    } catch (error) {
      console.error('Auth check error:', error);
      return false;
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const session = await this.getCurrentSession();
      return session?.user || null;
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  },
};

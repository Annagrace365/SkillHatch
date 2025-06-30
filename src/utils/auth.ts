import { supabase } from '../lib/supabase';
import { User } from '../types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

// Force logout and clear all session data
export const forceLogoutAndClearSession = async (): Promise<void> => {
  try {
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    // Clear all Supabase-related localStorage items
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (supabaseUrl) {
      const supabaseKey = supabaseUrl.split('//')[1]?.split('.')[0];
      if (supabaseKey) {
        localStorage.removeItem(`sb-${supabaseKey}-auth-token`);
      }
    }
    
    // Clear any other Supabase-related items
    Object.keys(localStorage).forEach(key => {
      if (key.includes('supabase') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    
    // Clear the generic supabase auth token
    localStorage.removeItem('supabase.auth.token');
    
    // Force page reload to reinitialize Supabase client with clean state
    window.location.reload();
  } catch (error) {
    console.warn('Error during force logout:', error);
    
    // Even if signOut fails, clear localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.includes('supabase') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    
    // Force page reload to reinitialize Supabase client with clean state
    window.location.reload();
  }
};

// Check if error is the specific refresh token error
const isRefreshTokenError = (error: any): boolean => {
  return error && (
    error.message?.includes('refresh_token_not_found') ||
    error.message?.includes('Invalid Refresh Token: Refresh Token Not Found') ||
    error.code === 'refresh_token_not_found'
  );
};

// Check if error is the normal "Auth session missing" error
const isAuthSessionMissingError = (error: any): boolean => {
  return error && error.message === 'Auth session missing!';
};

// Get current user from Supabase session and public.users table
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    // Use getSession for faster initial load
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      // Check for refresh token error and handle it
      if (isRefreshTokenError(sessionError)) {
        console.warn('Invalid refresh token detected, clearing session');
        await forceLogoutAndClearSession();
        return null;
      }
      
      // Don't log "Auth session missing!" as an error since it's normal for unauthenticated users
      if (!isAuthSessionMissingError(sessionError)) {
        console.error('Error getting session:', sessionError);
      }
      return null;
    }
    
    if (!session?.user) {
      // No user session - this is normal when not logged in
      return null;
    }

    // Get user profile from public.users table with timeout
    const { data: profile, error: profileError } = await Promise.race([
      supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
      )
    ]) as any;

    if (profileError) {
      // Check for refresh token error in profile fetch
      if (isRefreshTokenError(profileError)) {
        console.warn('Invalid refresh token detected during profile fetch, clearing session');
        await forceLogoutAndClearSession();
        return null;
      }
      
      console.warn('Error fetching user profile, using fallback:', profileError);
      // Fallback to auth user data if profile doesn't exist
      return {
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.user_metadata?.name || session.user.email || '',
        createdAt: session.user.created_at || new Date().toISOString(),
        isPremium: false // Default to false for fallback users
      };
    }

    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      createdAt: profile.created_at,
      isPremium: profile.is_premium || false // Add premium status
    };
  } catch (error) {
    // Check for refresh token error in catch block
    if (isRefreshTokenError(error)) {
      console.warn('Invalid refresh token detected in catch, clearing session');
      await forceLogoutAndClearSession();
      return null;
    }
    
    console.warn('Error getting current user:', error);
    return null;
  }
};

// Register a new user using Supabase Auth
export const register = async (credentials: RegisterCredentials): Promise<{ success: boolean; error?: string; user?: User }> => {
  const { name, email, password } = credentials;
  
  // Basic validation
  if (!name.trim() || !email.trim() || !password.trim()) {
    return { success: false, error: 'All fields are required' };
  }
  
  if (password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters' };
  }
  
  if (!email.includes('@') || !email.includes('.')) {
    return { success: false, error: 'Please enter a valid email address' };
  }

  try {
    // Use Supabase Auth to create user with timeout
    const { data, error } = await Promise.race([
      supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password: password,
        options: {
          data: {
            name: name.trim()
          }
        }
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Registration timeout')), 10000)
      )
    ]) as any;

    if (error) {
      console.error('Registration error:', error);
      
      if (error.message.includes('already registered') || error.message.includes('already been registered')) {
        return { success: false, error: 'An account with this email already exists' };
      }
      
      if (error.message.includes('Password should be at least')) {
        return { success: false, error: 'Password must be at least 6 characters long' };
      }
      
      if (error.message.includes('Invalid email')) {
        return { success: false, error: 'Please enter a valid email address' };
      }
      
      return { success: false, error: error.message || 'Failed to create account. Please try again.' };
    }

    if (!data.user) {
      return { success: false, error: 'Failed to create account. Please try again.' };
    }

    // The trigger will automatically create the user profile
    // Wait a moment for the trigger to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    const newUser: User = {
      id: data.user.id,
      email: data.user.email || '',
      name: name.trim(),
      createdAt: data.user.created_at || new Date().toISOString(),
      isPremium: false // New users start as free
    };

    return { success: true, user: newUser };

  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: 'An unexpected error occurred. Please try again.' };
  }
};

// Login user using Supabase Auth
export const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string; user?: User }> => {
  const { email, password } = credentials;
  
  if (!email.trim() || !password.trim()) {
    return { success: false, error: 'Email and password are required' };
  }

  try {
    const { data, error } = await Promise.race([
      supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password: password
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Login timeout')), 10000)
      )
    ]) as any;

    if (error) {
      console.error('Login error:', error);
      
      if (error.message.includes('Invalid login credentials') || error.message.includes('invalid_credentials')) {
        return { success: false, error: 'Invalid email or password. Please check your credentials and try again.' };
      }
      
      if (error.message.includes('Email not confirmed')) {
        return { success: false, error: 'Please check your email and confirm your account before signing in.' };
      }
      
      if (error.message.includes('Too many requests')) {
        return { success: false, error: 'Too many login attempts. Please wait a moment and try again.' };
      }
      
      return { success: false, error: error.message || 'An error occurred during login' };
    }

    if (!data.user || !data.session) {
      return { success: false, error: 'Login failed. Please try again.' };
    }

    // Get user profile from public.users table with timeout
    const { data: profile, error: profileError } = await Promise.race([
      supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
      )
    ]) as any;

    let authenticatedUser: User;

    if (profileError) {
      console.warn('User profile not found, using auth data:', profileError);
      // Fallback to auth user data
      authenticatedUser = {
        id: data.user.id,
        email: data.user.email || '',
        name: data.user.user_metadata?.name || data.user.email || '',
        createdAt: data.user.created_at || new Date().toISOString(),
        isPremium: false // Default to false for fallback users
      };
    } else {
      authenticatedUser = {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        createdAt: profile.created_at,
        isPremium: profile.is_premium || false
      };
    }

    return { success: true, user: authenticatedUser };

  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

// Logout user - Optimized implementation
export const logout = async (): Promise<void> => {
  try {
    console.log('Starting logout process...');
    
    // Sign out from Supabase with timeout
    const { error } = await Promise.race([
      supabase.auth.signOut(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Logout timeout')), 5000)
      )
    ]) as any;
    
    if (error) {
      console.warn('Logout error:', error);
      // Continue with cleanup even if there's an error
    }
    
    // Clear all localStorage items related to Supabase
    const keysToRemove: string[] = [];
    
    // Collect all keys that should be removed
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('sb-'))) {
        keysToRemove.push(key);
      }
    }
    
    // Remove collected keys
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn('Error removing localStorage key:', key, error);
      }
    });
    
    // Also clear any app-specific data
    try {
      localStorage.removeItem('generatedIdeas');
    } catch (error) {
      console.warn('Error clearing app data:', error);
    }
    
    console.log('Logout completed successfully');
    
    // Force a page reload to ensure clean state
    window.location.href = '/';
    
  } catch (error) {
    console.error('Logout error:', error);
    
    // Force cleanup even if there's an error
    Object.keys(localStorage).forEach(key => {
      if (key.includes('supabase') || key.includes('sb-')) {
        try {
          localStorage.removeItem(key);
        } catch (removeError) {
          console.warn('Error removing key during cleanup:', key, removeError);
        }
      }
    });
    
    // Force page reload
    window.location.href = '/';
  }
};

// Check if user is authenticated - Optimized
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    // Use getSession for faster check
    const { data: { session }, error: sessionError } = await Promise.race([
      supabase.auth.getSession(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth check timeout')), 3000)
      )
    ]) as any;
    
    if (sessionError) {
      // Check for refresh token error
      if (isRefreshTokenError(sessionError)) {
        console.warn('Invalid refresh token detected during session check, clearing session');
        await forceLogoutAndClearSession();
        return false;
      }
      
      console.warn('Auth check error:', sessionError);
      return false;
    }
    
    // If no session, user is not authenticated
    return !!(session && session.user);
  } catch (error) {
    // Check for refresh token error in catch block
    if (isRefreshTokenError(error)) {
      console.warn('Invalid refresh token detected in auth check catch, clearing session');
      await forceLogoutAndClearSession();
      return false;
    }
    
    console.warn('Auth check error:', error);
    return false;
  }
};

// Get current session - Optimized
export const getCurrentSession = async () => {
  try {
    const { data: { session }, error } = await Promise.race([
      supabase.auth.getSession(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session fetch timeout')), 3000)
      )
    ]) as any;
    
    if (error) {
      // Check for refresh token error
      if (isRefreshTokenError(error)) {
        console.warn('Invalid refresh token detected during session fetch, clearing session');
        await forceLogoutAndClearSession();
        return null;
      }
      
      console.warn('Session error:', error);
      return null;
    }
    return session;
  } catch (error) {
    // Check for refresh token error in catch block
    if (isRefreshTokenError(error)) {
      console.warn('Invalid refresh token detected in session fetch catch, clearing session');
      await forceLogoutAndClearSession();
      return null;
    }
    
    console.warn('Session error:', error);
    return null;
  }
};
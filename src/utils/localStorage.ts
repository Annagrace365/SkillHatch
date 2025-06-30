import { supabase } from '../lib/supabase';
import { StartupIdea } from '../types';

// Get user's favorites from Supabase - Optimized
export const getFavorites = async (): Promise<StartupIdea[]> => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.warn('Cannot load favorites: User not authenticated');
      return [];
    }

    const { data, error } = await Promise.race([
      supabase
        .from('favorites')
        .select('idea_data')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Favorites fetch timeout')), 7000)
      )
    ]) as any;

    if (error) {
      console.error('Error loading favorites:', error);
      return [];
    }

    return data?.map(item => item.idea_data as StartupIdea) || [];
  } catch (error) {
    console.error('Error loading favorites:', error);
    return [];
  }
};

// Add idea to favorites in Supabase - Optimized
export const addToFavorites = async (idea: StartupIdea): Promise<boolean> => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.warn('Cannot save favorites: User not authenticated');
      return false;
    }

    // Check if already exists to prevent duplicates
    const { data: existing, error: checkError } = await Promise.race([
      supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('idea_data->>id', idea.id)
        .maybeSingle(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Duplicate check timeout')), 7000)
      )
    ]) as any;

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing favorite:', checkError);
      return false;
    }

    if (existing) {
      console.log('Idea already in favorites');
      return true; // Already exists
    }

    const { error } = await Promise.race([
      supabase
        .from('favorites')
        .insert({
          user_id: user.id,
          idea_data: idea
        }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Insert favorite timeout')), 7000)
      )
    ]) as any;

    if (error) {
      console.error('Error saving favorite:', error);
      return false;
    }

    console.log('Successfully added to favorites');
    return true;
  } catch (error) {
    console.error('Error saving favorite:', error);
    return false;
  }
};

// Remove idea from favorites in Supabase - Optimized
export const removeFromFavorites = async (ideaId: string): Promise<boolean> => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.warn('Cannot remove favorites: User not authenticated');
      return false;
    }

    const { error } = await Promise.race([
      supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('idea_data->>id', ideaId),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Remove favorite timeout')), 7000)
      )
    ]) as any;

    if (error) {
      console.error('Error removing favorite:', error);
      return false;
    }

    console.log('Successfully removed from favorites');
    return true;
  } catch (error) {
    console.error('Error removing favorite:', error);
    return false;
  }
};

// Check if idea is favorited - Optimized
export const isFavorite = async (ideaId: string): Promise<boolean> => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return false;
    }

    const { data, error } = await Promise.race([
      supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('idea_data->>id', ideaId)
        .maybeSingle(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Favorite check timeout')), 7000)
      )
    ]) as any;

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking favorite:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking favorite:', error);
    return false;
  }
};

// Clear user favorites (for logout) - not needed with Supabase
export const clearUserFavorites = (): void => {
  // No action needed - Supabase handles user session cleanup
};
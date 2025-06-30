export interface UserInput {
  skills: string[];
  experienceLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  interests: string[];
}

export interface StartupIdea {
  id: string;
  title: string;
  description: string;
  marketSize: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timeToMarket: string;
  revenueModel: string;
  targetAudience: string;
  keyFeatures: string[];
  competitiveAdvantage: string;
  matchingSkills: string[];
  matchingInterests: string[];
}

// Removed StartupTemplate interface as it's no longer needed
// All startup ideas are now stored in Supabase database

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  isPremium?: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
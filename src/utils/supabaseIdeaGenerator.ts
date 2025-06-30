import { supabase } from '../lib/supabase';
import { UserInput, StartupIdea } from '../types';

interface DatabaseStartupIdea {
  id: string;
  title: string;
  description: string;
  market_size: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  time_to_market: string;
  revenue_model: string;
  target_audience: string;
  key_features: string[];
  competitive_advantage: string;
  required_skills: string[];
  target_interests: string[];
  keywords: string[];
  created_at: string;
}

// Enhanced skills and interests for better student relevance
export const commonSkills = [
  'Web Development',
  'Mobile Development',
  'AI/ML',
  'Data Science',
  'Design',
  'Marketing',
  'Sales',
  'Project Management',
  'Social Media',
  'E-commerce',
  'Writing',
  'Photography',
  'Video Production',
  'Business Development',
  'Customer Service',
  'Event Planning',
  'Tutoring',
  'Research',
  'Public Speaking',
  'Content Creation',
  'Graphic Design',
  'Finance',
  'Psychology',
  'Healthcare',
  'Education',
  'Logistics',
  'Translation',
  'Music Production',
  'Fitness Training',
  'Cooking',
  'UX Design',
  'Career Counseling',
  'OCR/NLP',
  'Job Portal APIs',
  'UI Design',
  'Marketplace Management',
  'Mobile App',
  'Safety'
];

export const commonInterests = [
  'Technology',
  'Education',
  'Healthcare',
  'Finance',
  'Environment',
  'Sustainability',
  'Food',
  'Fashion',
  'Fitness',
  'Mental Health',
  'Gaming',
  'Social Media',
  'Content Creation',
  'Student Life',
  'Community',
  'Business',
  'Design',
  'Music',
  'Sports',
  'Travel',
  'Books',
  'Movies',
  'Art',
  'Photography',
  'Volunteering',
  'Local Community',
  'Career Development',
  'Skills Development',
  'Networking',
  'Innovation',
  'Events',
  'Freelancing',
  'Housing',
  'Lifestyle',
  'AI',
  'Productivity',
  'Jobs',
  'Career',
  'Mentorship',
  'Transportation',
  'Health',
  'Savings',
  'Local Business'
];

// Calculate match score for an idea based on user input
const calculateMatchScore = (
  idea: DatabaseStartupIdea,
  userInput: UserInput
): { score: number; matchingSkills: string[]; matchingInterests: string[] } => {
  const { skills, experienceLevel, interests } = userInput;
  let score = 0;
  const matchingSkills: string[] = [];
  const matchingInterests: string[] = [];

  // Enhanced skills matching with partial matches and synonyms
  skills.forEach(skill => {
    const skillLower = skill.toLowerCase();
    
    // Direct skill matches (highest weight)
    if (idea.required_skills.some(reqSkill => 
      reqSkill.toLowerCase() === skillLower ||
      reqSkill.toLowerCase().includes(skillLower) || 
      skillLower.includes(reqSkill.toLowerCase())
    )) {
      score += 15;
      matchingSkills.push(skill);
    }
    
    // Keyword matches in description and features
    const allText = (idea.description + ' ' + idea.key_features.join(' ')).toLowerCase();
    if (allText.includes(skillLower)) {
      score += 5;
      if (!matchingSkills.includes(skill)) {
        matchingSkills.push(skill);
      }
    }
  });

  // Enhanced interests matching
  interests.forEach(interest => {
    const interestLower = interest.toLowerCase();
    
    // Direct interest matches
    if (idea.target_interests.some(targetInt => 
      targetInt.toLowerCase() === interestLower ||
      targetInt.toLowerCase().includes(interestLower) || 
      interestLower.includes(targetInt.toLowerCase())
    )) {
      score += 12;
      matchingInterests.push(interest);
    }
    
    // Keyword matches
    if (idea.keywords.some(keyword => 
      keyword.toLowerCase() === interestLower ||
      keyword.toLowerCase().includes(interestLower) || 
      interestLower.includes(keyword.toLowerCase())
    )) {
      score += 6;
      if (!matchingInterests.includes(interest)) {
        matchingInterests.push(interest);
      }
    }
    
    // Description and feature matches
    const allText = (idea.description + ' ' + idea.target_audience + ' ' + idea.key_features.join(' ')).toLowerCase();
    if (allText.includes(interestLower)) {
      score += 3;
    }
  });

  // Experience level and difficulty matching (student-focused)
  const difficultyAdjustment = {
    'Beginner': { 'Easy': 10, 'Medium': 2, 'Hard': -8 },
    'Intermediate': { 'Easy': 5, 'Medium': 10, 'Hard': 0 },
    'Advanced': { 'Easy': 2, 'Medium': 8, 'Hard': 10 }
  };
  
  score += difficultyAdjustment[experienceLevel][idea.difficulty];

  // Boost student-friendly ideas
  if (idea.target_audience.toLowerCase().includes('student') || 
      idea.description.toLowerCase().includes('student') ||
      idea.title.toLowerCase().includes('student') ||
      idea.title.toLowerCase().includes('campus')) {
    score += 8;
  }

  // Boost ideas with realistic time to market for students
  if (idea.time_to_market.includes('2-3') || idea.time_to_market.includes('2-4')) {
    score += 5;
  }

  // Ensure minimum viable matches
  if (matchingSkills.length === 0 && matchingInterests.length === 0) {
    score = score * 0.3; // Heavily penalize ideas with no clear matches
  }

  // Add controlled randomness for variety
  score += Math.random() * 4;

  return { score, matchingSkills, matchingInterests };
};

// Helper function to enhance descriptions for student context
const enhanceDescriptionForStudent = (description: string, experienceLevel: string): string => {
  const studentContext = {
    'Beginner': 'Perfect for getting started with entrepreneurship while building valuable experience.',
    'Intermediate': 'A great opportunity to leverage your growing skills and create meaningful impact.',
    'Advanced': 'An excellent chance to apply your expertise and potentially scale into a significant business.'
  };
  
  return `${description} ${studentContext[experienceLevel]}`;
};

// Convert database idea to frontend format
const convertDatabaseIdeaToStartupIdea = (
  dbIdea: DatabaseStartupIdea,
  matchingSkills: string[],
  matchingInterests: string[],
  experienceLevel: string
): StartupIdea => {
  return {
    id: dbIdea.id,
    title: dbIdea.title,
    description: enhanceDescriptionForStudent(dbIdea.description, experienceLevel),
    marketSize: dbIdea.market_size,
    difficulty: dbIdea.difficulty,
    timeToMarket: dbIdea.time_to_market,
    revenueModel: dbIdea.revenue_model,
    targetAudience: dbIdea.target_audience,
    keyFeatures: dbIdea.key_features,
    competitiveAdvantage: dbIdea.competitive_advantage,
    matchingSkills,
    matchingInterests
  };
};

// Main function to generate startup ideas from Supabase - Optimized
export const generateStartupIdeasFromSupabase = async (userInput: UserInput): Promise<StartupIdea[]> => {
  try {
    console.log('Fetching startup ideas from Supabase...');
    
    // Fetch all active startup ideas from Supabase with timeout
    const { data: ideas, error } = await Promise.race([
      supabase
        .from('startup_ideas')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 8000)
      )
    ]) as any;

    if (error) {
      console.error('Error fetching startup ideas:', error);
      throw new Error('Failed to fetch startup ideas from database');
    }

    if (!ideas || ideas.length === 0) {
      console.warn('No startup ideas found in database');
      return [];
    }

    console.log(`Found ${ideas.length} startup ideas in database`);

    // Calculate match scores for each idea
    const scoredIdeas = ideas.map(idea => {
      const { score, matchingSkills, matchingInterests } = calculateMatchScore(idea, userInput);
      return {
        idea,
        score,
        matchingSkills,
        matchingInterests
      };
    });

    // Sort by score and determine how many ideas to return
    const sortedIdeas = scoredIdeas.sort((a, b) => b.score - a.score);
    
    // Determine number of ideas to return based on match quality
    let numberOfIdeas = 4; // Minimum 4 ideas
    
    // Count high-quality matches (score > 20)
    const highQualityMatches = sortedIdeas.filter(item => item.score > 20).length;
    
    // Increase number of ideas based on available high-quality matches
    if (highQualityMatches >= 8) {
      numberOfIdeas = Math.min(8, highQualityMatches); // Up to 8 ideas if many good matches
    } else if (highQualityMatches >= 6) {
      numberOfIdeas = 6; // 6 ideas for good matches
    } else if (highQualityMatches >= 4) {
      numberOfIdeas = 5; // 5 ideas for decent matches
    }
    
    // Ensure we don't exceed available ideas
    numberOfIdeas = Math.min(numberOfIdeas, sortedIdeas.length);
    
    // Take the determined number of top ideas
    const selectedIdeas = sortedIdeas.slice(0, numberOfIdeas);
    
    console.log(`Returning ${selectedIdeas.length} matched startup ideas`);

    // Convert to StartupIdea format
    return selectedIdeas.map(item => 
      convertDatabaseIdeaToStartupIdea(
        item.idea,
        item.matchingSkills,
        item.matchingInterests,
        userInput.experienceLevel
      )
    );

  } catch (error) {
    console.error('Error generating startup ideas from Supabase:', error);
    throw error;
  }
};

// Function to add new startup idea to database (for future admin features)
export const addStartupIdeaToDatabase = async (idea: Omit<DatabaseStartupIdea, 'id' | 'created_at'>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('startup_ideas')
      .insert([idea]);

    if (error) {
      console.error('Error adding startup idea to database:', error);
      return false;
    }

    console.log('Successfully added startup idea to database');
    return true;
  } catch (error) {
    console.error('Error adding startup idea to database:', error);
    return false;
  }
};

// Function to update startup idea in database (for future admin features)
export const updateStartupIdeaInDatabase = async (id: string, updates: Partial<DatabaseStartupIdea>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('startup_ideas')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating startup idea in database:', error);
      return false;
    }

    console.log('Successfully updated startup idea in database');
    return true;
  } catch (error) {
    console.error('Error updating startup idea in database:', error);
    return false;
  }
};

// Function to search startup ideas by text (for future search features)
export const searchStartupIdeas = async (searchTerm: string): Promise<DatabaseStartupIdea[]> => {
  try {
    const { data: ideas, error } = await supabase
      .from('startup_ideas')
      .select('*')
      .eq('is_active', true)
      .textSearch('title', searchTerm)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error searching startup ideas:', error);
      return [];
    }

    return ideas || [];
  } catch (error) {
    console.error('Error searching startup ideas:', error);
    return [];
  }
};

// Save user progress for an idea
export const saveIdeaProgress = async (
  userId: string,
  ideaId: string,
  completedSteps: boolean[]
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('idea_progress')
      .upsert([
        {
          user_id: userId,
          idea_id: ideaId,
          completed_steps: completedSteps,
          updated_at: new Date().toISOString(),
        },
      ], { onConflict: ['user_id', 'idea_id'] });
    if (error) {
      console.error('Error saving idea progress:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error saving idea progress:', error);
    return false;
  }
};

// Load user progress for an idea
export const loadIdeaProgress = async (
  userId: string,
  ideaId: string
): Promise<boolean[] | null> => {
  try {
    const { data, error } = await supabase
      .from('idea_progress')
      .select('completed_steps')
      .eq('user_id', userId)
      .eq('idea_id', ideaId)
      .maybeSingle();
    if (error) {
      console.error('Error loading idea progress:', error);
      return null;
    }
    return data?.completed_steps ?? null;
  } catch (error) {
    console.error('Error loading idea progress:', error);
    return null;
  }
};

// Get all proceeded ideas for a user
export const getProceededIdeas = async (userId: string): Promise<StartupIdea[]> => {
  try {
    // Get all idea_ids from idea_progress for this user
    const { data: progressRows, error: progressError } = await supabase
      .from('idea_progress')
      .select('idea_id')
      .eq('user_id', userId);
    if (progressError) {
      console.error('Error fetching proceeded idea ids:', progressError);
      return [];
    }
    const ideaIds = progressRows?.map(row => row.idea_id) || [];
    if (ideaIds.length === 0) return [];

    // Fetch full idea data for these ids
    const { data: ideas, error: ideasError } = await supabase
      .from('startup_ideas')
      .select('*')
      .in('id', ideaIds);
    if (ideasError) {
      console.error('Error fetching proceeded ideas:', ideasError);
      return [];
    }
    // Convert to StartupIdea format (minimal, no matching/interests)
    return ideas.map(idea => ({
      id: idea.id,
      title: idea.title,
      description: idea.description,
      marketSize: idea.market_size,
      difficulty: idea.difficulty,
      timeToMarket: idea.time_to_market,
      revenueModel: idea.revenue_model,
      targetAudience: idea.target_audience,
      keyFeatures: idea.key_features,
      competitiveAdvantage: idea.competitive_advantage,
      matchingSkills: [],
      matchingInterests: []
    }));
  } catch (error) {
    console.error('Error getting proceeded ideas:', error);
    return [];
  }
};
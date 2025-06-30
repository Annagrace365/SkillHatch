// This file is no longer needed since we've moved to Supabase-based idea generation
// All functionality has been migrated to src/utils/supabaseIdeaGenerator.ts

// If you need the old logic for reference, it can be found in the git history
// The new Supabase-based system provides better performance and scalability

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
  'Cooking'
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
  'Innovation'
];

// Legacy function - use generateStartupIdeasFromSupabase instead
export const generateStartupIdeas = () => {
  throw new Error('This function has been deprecated. Use generateStartupIdeasFromSupabase from utils/supabaseIdeaGenerator.ts instead.');
};
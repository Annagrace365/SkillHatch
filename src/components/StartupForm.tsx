import React, { useState } from 'react';
import { Lightbulb, ArrowRight, Sparkles, Target, Zap } from 'lucide-react';
import { UserInput } from '../types';
import { commonSkills, commonInterests } from '../utils/supabaseIdeaGenerator';
import SkillInput from './SkillInput';

interface StartupFormProps {
  onSubmit: (input: UserInput) => void;
  isGenerating: boolean;
}

const StartupForm: React.FC<StartupFormProps> = ({ onSubmit, isGenerating }) => {
  const [skills, setSkills] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [interests, setInterests] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (skills.length > 0 && interests.length > 0) {
      onSubmit({ skills, experienceLevel, interests });
    }
  };

  const isFormValid = skills.length > 0 && interests.length > 0;

  return (
    <div className="relative">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 rounded-3xl"></div>
      <div className="absolute -top-4 -left-4 w-24 h-24 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-xl"></div>
      <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-xl"></div>
      
      <div className="relative bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 max-w-2xl w-full border border-white/20">
        <div className="text-center mb-8">
          <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-2xl animate-pulse opacity-75"></div>
            <div className="relative w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
              <Lightbulb className="text-white" size={32} />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
              <Sparkles className="text-white" size={12} />
            </div>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Generate Your Startup Ideas
          </h2>
          <p className="text-gray-600 text-lg leading-relaxed">
            Tell us about your <span className="font-semibold text-indigo-600">skills</span> and <span className="font-semibold text-purple-600">interests</span> to get personalized startup recommendations from our curated database
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Skills Input */}
          <div className="relative">
            <div className="absolute -top-2 -left-2 w-4 h-4 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full opacity-60"></div>
            <SkillInput
              skills={skills}
              onSkillsChange={setSkills}
              suggestions={commonSkills}
              placeholder="Type a skill and press Enter (e.g., Web Development)"
              label="Your Skills"
            />
          </div>

          {/* Experience Level */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Target className="text-indigo-600" size={20} />
              <label className="text-lg font-semibold text-gray-800">
                Experience Level
              </label>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {(['Beginner', 'Intermediate', 'Advanced'] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setExperienceLevel(level)}
                  className={`relative px-6 py-4 rounded-2xl font-semibold transition-all duration-200 ${
                    experienceLevel === level
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl scale-105'
                      : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 hover:from-gray-100 hover:to-gray-200 hover:shadow-lg border border-gray-200'
                  }`}
                >
                  {experienceLevel === level && (
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-2xl opacity-50 animate-pulse"></div>
                  )}
                  <span className="relative">{level}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Interests Input */}
          <div className="relative">
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-60"></div>
            <SkillInput
              skills={interests}
              onSkillsChange={setInterests}
              suggestions={commonInterests}
              placeholder="Type an interest and press Enter (e.g., Healthcare)"
              label="Your Interests"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={!isFormValid || isGenerating}
              className={`w-full py-5 px-8 rounded-2xl font-bold text-lg transition-all duration-300 relative overflow-hidden ${
                isFormValid && !isGenerating
                  ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white shadow-2xl hover:shadow-3xl transform hover:scale-[1.02]'
                  : 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-500 cursor-not-allowed'
              }`}
            >
              {/* Animated background for active state */}
              {isFormValid && !isGenerating && (
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 opacity-0 hover:opacity-20 transition-opacity duration-300"></div>
              )}
              
              <span className="relative inline-flex items-center justify-center">
                {isGenerating ? (
                  <>
                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
                    <Zap className="mr-3 animate-pulse" size={24} />
                    Fetching Ideas from Database...
                  </>
                ) : (
                  <>
                    Generate Startup Ideas
                    <ArrowRight className="ml-3 transition-transform group-hover:translate-x-1" size={24} />
                  </>
                )}
              </span>
            </button>
          </div>
        </form>

        {/* Form validation hint */}
        {(!skills.length || !interests.length) && (
          <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
            <p className="text-amber-800 text-sm font-medium text-center">
              Please add at least one skill and one interest to generate personalized ideas
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StartupForm;
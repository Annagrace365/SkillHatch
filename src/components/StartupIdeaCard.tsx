import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  Clock, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Target,
  Star,
  ChevronDown,
  ChevronUp,
  Lock,
  Play,
  Pause,
  Loader,
  FileText,
  Briefcase,
  Crown,
  Download,
  ArrowRight,
  Sparkles,
  Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { StartupIdea } from '../types';
import { addToFavorites, removeFromFavorites, isFavorite } from '../utils/localStorage';
import { isAuthenticated, getCurrentUser } from '../utils/auth';
import { getUserSubscription } from '../utils/stripe';
import { generateMarketReportPDF, generateStartupToolkit } from '../utils/pdfGenerator';

interface StartupIdeaCardProps {
  idea: StartupIdea;
  onFavoriteChange?: () => void;
  onAuthRequired?: () => void;
  currentAudio?: HTMLAudioElement | null;
  onAudioChange?: (audio: HTMLAudioElement | null) => void;
  isPremiumUser?: boolean;
  onPremiumRequired?: () => void;
  onProceed?: (ideaId: string) => void;
}

const StartupIdeaCard: React.FC<StartupIdeaCardProps> = ({ 
  idea, 
  onFavoriteChange,
  onAuthRequired,
  currentAudio,
  onAudioChange,
  isPremiumUser = false,
  onPremiumRequired,
  onProceed
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [showAuthTooltip, setShowAuthTooltip] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [isProcessingFavorite, setIsProcessingFavorite] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      try {
        const authenticated = await isAuthenticated();
        if (authenticated) {
          const isFav = await isFavorite(idea.id);
          setFavorited(isFav);
        } else {
          setFavorited(false);
        }
      } catch (error) {
        console.error('Error checking favorite status:', error);
        setFavorited(false);
      }
    };
    checkFavoriteStatus();
  }, [idea.id]);

  // Update playing state based on current audio
  useEffect(() => {
    // Check if our audio is the currently playing audio
    if (currentAudio === audio && audio && !audio.paused) {
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
    
    // If another audio is playing and we have audio, stop ours
    if (currentAudio && currentAudio !== audio && audio) {
      audio.pause();
      setAudio(null);
    }
  }, [currentAudio, audio]);

  // Store idea in localStorage for detail page access
  useEffect(() => {
    try {
      const savedIdeas = localStorage.getItem('generatedIdeas');
      let ideas: StartupIdea[] = [];
      
      if (savedIdeas) {
        ideas = JSON.parse(savedIdeas);
      }
      
      // Update or add the current idea
      const existingIndex = ideas.findIndex(i => i.id === idea.id);
      if (existingIndex >= 0) {
        ideas[existingIndex] = idea;
      } else {
        ideas.push(idea);
      }
      
      localStorage.setItem('generatedIdeas', JSON.stringify(ideas));
    } catch (error) {
      console.error('Error saving idea to localStorage:', error);
    }
  }, [idea]);

  const handleFavoriteToggle = async () => {
    // Prevent multiple clicks while processing
    if (isProcessingFavorite) {
      return;
    }

    try {
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        setShowAuthTooltip(true);
        setTimeout(() => setShowAuthTooltip(false), 3000);
        onAuthRequired?.();
        return;
      }

      setIsProcessingFavorite(true);

      let success = false;
      
      if (favorited) {
        // Remove from favorites
        success = await removeFromFavorites(idea.id);
        if (success) {
          setFavorited(false);
          console.log('Removed from favorites successfully');
        }
      } else {
        // Add to favorites
        success = await addToFavorites(idea);
        if (success) {
          setFavorited(true);
          console.log('Added to favorites successfully');
        }
      }

      if (success) {
        onFavoriteChange?.();
      } else {
        console.error('Failed to update favorite status');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setIsProcessingFavorite(false);
    }
  };

  const generateIdeaText = () => {
    const expandedText = isExpanded ? `
      Revenue Model: ${idea.revenueModel}.
      Target Audience: ${idea.targetAudience}.
      Key Features include: ${idea.keyFeatures.join(', ')}.
      Competitive Advantage: ${idea.competitiveAdvantage}.
    ` : '';

    return `
      ${idea.title}.
      ${idea.description}
      This is a ${idea.difficulty.toLowerCase()} difficulty project with a market size of ${idea.marketSize}.
      Expected time to market is ${idea.timeToMarket}.
      ${expandedText}
    `.trim();
  };

  const handleListenToOverview = async () => {
    // If currently playing, stop the audio
    if (isPlaying && audio) {
      audio.pause();
      setAudio(null);
      setIsPlaying(false);
      onAudioChange?.(null);
      return;
    }

    // Stop any other playing audio first
    if (currentAudio) {
      currentAudio.pause();
    }

    setIsLoading(true);

    try {
      const text = generateIdeaText();
      const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
      
      if (!apiKey) {
        throw new Error('ElevenLabs API key not configured. Please add VITE_ELEVENLABS_API_KEY to your .env file.');
      }

      const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.7,
            similarity_boost: 0.8
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const newAudio = new Audio(audioUrl);

      // Set up event listeners
      newAudio.onended = () => {
        setIsPlaying(false);
        setAudio(null);
        onAudioChange?.(null);
        URL.revokeObjectURL(audioUrl);
      };

      newAudio.onerror = () => {
        setIsPlaying(false);
        setAudio(null);
        onAudioChange?.(null);
        URL.revokeObjectURL(audioUrl);
        console.error('Audio playback error');
      };

      newAudio.onpause = () => {
        setIsPlaying(false);
      };

      // Set the audio first
      setAudio(newAudio);
      onAudioChange?.(newAudio);
      
      // Start playing and update state when play actually starts
      await newAudio.play();
      setIsPlaying(true);

    } catch (error) {
      console.error('Error generating audio:', error);
      alert('Failed to generate audio. Please try again.');
      setIsPlaying(false);
      setAudio(null);
      onAudioChange?.(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePremiumFeature = async (featureType: 'market-report' | 'startup-toolkit') => {
    try {
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        onAuthRequired?.();
        return;
      }

      if (!isPremiumUser) {
        onPremiumRequired?.();
        return;
      }

      // Handle premium feature access for premium users
      setIsGeneratingPDF(true);
      
      if (featureType === 'market-report') {
        // Generate and download market report PDF
        await generateMarketReportPDF(idea);
        
        // Show success message
        setTimeout(() => {
          alert('✅ Deep Market Report generated and downloaded successfully!');
        }, 500);
      } else if (featureType === 'startup-toolkit') {
        // Generate startup toolkit PDF
        await generateStartupToolkit(idea);
        
        // Show success message
        setTimeout(() => {
          alert('✅ Startup Toolkit generated and downloaded successfully!');
        }, 500);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('❌ Error generating PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleProceed = async () => {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      onAuthRequired?.();
      return;
    }
    if (!isPremiumUser) {
      onPremiumRequired?.();
      return;
    }
    if (onProceed) {
      onProceed(idea.id);
    }
    // If no onProceed, fallback to Link navigation
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-emerald-700 bg-gradient-to-r from-emerald-100 to-green-100 border-emerald-200';
      case 'Medium': return 'text-amber-700 bg-gradient-to-r from-amber-100 to-yellow-100 border-amber-200';
      case 'Hard': return 'text-red-700 bg-gradient-to-r from-red-100 to-pink-100 border-red-200';
      default: return 'text-gray-700 bg-gradient-to-r from-gray-100 to-gray-200 border-gray-200';
    }
  };

  return (
    <div className="group relative bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden border border-white/20 hover:border-indigo-200/50">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      {/* Decorative elements */}
      <div className="absolute -top-2 -right-2 w-20 h-20 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 rounded-full blur-xl group-hover:from-indigo-400/20 group-hover:to-purple-400/20 transition-all duration-500"></div>
      
      {/* Header */}
      <div className="relative p-8 pb-6">
        <div className="flex items-start justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex-1 pr-4 group-hover:text-indigo-900 transition-colors duration-300">
            {idea.title}
          </h3>
          <div className="relative">
            <button
              onClick={handleFavoriteToggle}
              disabled={isProcessingFavorite}
              className={`p-3 rounded-2xl transition-all duration-300 relative ${
                isProcessingFavorite 
                  ? 'opacity-50 cursor-not-allowed'
                  : favorited 
                  ? 'text-red-500 bg-gradient-to-r from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100 shadow-lg border border-red-200' 
                  : 'text-gray-400 hover:text-red-500 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 border border-gray-200 hover:border-red-200 hover:shadow-lg'
              }`}
            >
              {isProcessingFavorite ? (
                <Loader className="animate-spin" size={20} />
              ) : (
                <Heart size={20} fill={favorited ? 'currentColor' : 'none'} />
              )}
            </button>
            
            {/* Auth Required Tooltip */}
            {showAuthTooltip && (
              <div className="absolute top-full right-0 mt-3 w-52 p-3 bg-gray-900 text-white text-sm rounded-xl shadow-2xl z-10 border border-gray-700">
                <div className="absolute -top-2 right-4 w-4 h-4 bg-gray-900 transform rotate-45 border-l border-t border-gray-700"></div>
                <p className="font-medium">Sign in to save your favorite ideas!</p>
              </div>
            )}
          </div>
        </div>

        <p className="text-gray-600 leading-relaxed mb-6 text-lg">
          {idea.description}
        </p>

        {/* Listen to Overview Button */}
        <div className="mb-6">
          <button
            onClick={handleListenToOverview}
            disabled={isLoading}
            className={`inline-flex items-center px-5 py-3 rounded-xl font-semibold transition-all duration-300 ${
              isLoading
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : isPlaying
                ? 'bg-gradient-to-r from-red-100 to-pink-100 text-red-600 hover:from-red-200 hover:to-pink-200 border border-red-200 shadow-lg'
                : 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-600 hover:from-blue-200 hover:to-indigo-200 border border-blue-200 hover:shadow-lg'
            }`}
          >
            {isLoading ? (
              <>
                <Loader className="animate-spin mr-3" size={18} />
                Generating Audio...
              </>
            ) : isPlaying ? (
              <>
                <Pause className="mr-3" size={18} />
                Stop Overview
              </>
            ) : (
              <>
                <Play className="mr-3" size={18} />
                Listen to Overview
              </>
            )}
          </button>
        </div>

        {/* Premium Features */}
        <div className="mb-6 flex flex-wrap gap-3">
          <button
            onClick={() => handlePremiumFeature('market-report')}
            disabled={isGeneratingPDF}
            className={`inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
              isGeneratingPDF
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 hover:from-gray-100 hover:to-gray-200 border border-gray-200 hover:border-gray-300 hover:shadow-lg'
            }`}
          >
            {isGeneratingPDF ? (
              <Loader className="animate-spin mr-2" size={16} />
            ) : (
              <>
                <Lock className="mr-2" size={16} />
                <FileText className="mr-2" size={16} />
              </>
            )}
            Deep Market Report
            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border border-amber-200">
              <Crown size={10} className="mr-1" />
              Premium
            </span>
          </button>
          
          <button
            onClick={() => handlePremiumFeature('startup-toolkit')}
            disabled={isGeneratingPDF}
            className={`inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
              isGeneratingPDF
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 hover:from-gray-100 hover:to-gray-200 border border-gray-200 hover:border-gray-300 hover:shadow-lg'
            }`}
          >
            {isGeneratingPDF ? (
              <Loader className="animate-spin mr-2" size={16} />
            ) : (
              <>
                <Lock className="mr-2" size={16} />
                <Briefcase className="mr-2" size={16} />
              </>
            )}
            Startup Toolkit
            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border border-amber-200">
              <Crown size={10} className="mr-1" />
              Premium
            </span>
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl border border-emerald-100">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <TrendingUp className="text-emerald-600" size={18} />
            </div>
            <div>
              <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide">Market Size</p>
              <p className="text-sm font-bold text-emerald-800">{idea.marketSize}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Clock className="text-blue-600" size={18} />
            </div>
            <div>
              <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">Time to Market</p>
              <p className="text-sm font-bold text-blue-800">{idea.timeToMarket}</p>
            </div>
          </div>
        </div>

        {/* Difficulty Badge and Actions */}
        <div className="flex items-center justify-between mb-6">
          <span className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold border ${getDifficultyColor(idea.difficulty)}`}>
            <Star size={16} className="mr-2" />
            {idea.difficulty} Difficulty
          </span>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center text-indigo-600 hover:text-indigo-700 font-semibold text-sm transition-colors duration-300 px-3 py-2 rounded-xl hover:bg-indigo-50"
          >
            {isExpanded ? 'Less Details' : 'More Details'}
            {isExpanded ? <ChevronUp size={18} className="ml-2" /> : <ChevronDown size={18} className="ml-2" />}
          </button>
        </div>

        {/* Proceed Button - Premium Feature */}
        <div className="mb-6">
          {isPremiumUser ? (
            <Link
              to={`/idea/${idea.id}`}
              className="w-full inline-flex items-center justify-center px-6 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white rounded-2xl transition-all duration-300 font-bold shadow-xl hover:shadow-2xl transform hover:scale-[1.02]"
            >
              <Zap size={20} className="mr-3" />
              Proceed with this Idea
              <ArrowRight size={20} className="ml-3" />
            </Link>
          ) : (
            <button
              onClick={handleProceed}
              className="w-full inline-flex items-center justify-center px-6 py-4 bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white rounded-2xl transition-all duration-300 font-bold shadow-lg relative"
            >
              <Lock size={18} className="mr-3" />
              Proceed with this Idea
              <span className="ml-3 inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800">
                <Crown size={12} className="mr-1" />
                Premium
              </span>
            </button>
          )}
        </div>

        {/* Matching Tags */}
        <div className="flex flex-wrap gap-2">
          {idea.matchingSkills.map((skill) => (
            <span key={skill} className="px-3 py-1.5 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 text-sm rounded-xl font-semibold border border-indigo-200">
              {skill}
            </span>
          ))}
          {idea.matchingInterests.map((interest) => (
            <span key={interest} className="px-3 py-1.5 bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-800 text-sm rounded-xl font-semibold border border-teal-200">
              {interest}
            </span>
          ))}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="relative px-8 pb-8 border-t border-gray-100/50">
          <div className="pt-6 space-y-6">
            {/* Revenue Model */}
            <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl border border-emerald-100">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <DollarSign className="text-emerald-600" size={20} />
              </div>
              <div>
                <h4 className="font-bold text-emerald-800 text-lg mb-2">Revenue Model</h4>
                <p className="text-emerald-700 leading-relaxed">{idea.revenueModel}</p>
              </div>
            </div>

            {/* Target Audience */}
            <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Users className="text-blue-600" size={20} />
              </div>
              <div>
                <h4 className="font-bold text-blue-800 text-lg mb-2">Target Audience</h4>
                <p className="text-blue-700 leading-relaxed">{idea.targetAudience}</p>
              </div>
            </div>

            {/* Key Features */}
            <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-100">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Target className="text-purple-600" size={20} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-purple-800 text-lg mb-3">Key Features</h4>
                <div className="grid grid-cols-1 gap-2">
                  {idea.keyFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-white/60 rounded-xl border border-purple-200/50">
                      <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                      <span className="text-purple-700 font-medium">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Competitive Advantage */}
            <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 p-6 rounded-2xl border border-indigo-200">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl">
                  <Sparkles className="text-indigo-600" size={20} />
                </div>
                <h4 className="font-bold text-indigo-800 text-lg">Competitive Advantage</h4>
              </div>
              <p className="text-indigo-700 leading-relaxed text-lg font-medium">{idea.competitiveAdvantage}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StartupIdeaCard;
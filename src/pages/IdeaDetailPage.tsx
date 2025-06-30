import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  CheckCircle, 
  Circle, 
  Clock, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Target,
  Star,
  Heart,
  Play,
  Pause,
  Loader,
  FileText,
  Briefcase,
  Crown,
  Download,
  Lock,
  Trophy,
  Zap,
  Sparkles
} from 'lucide-react';
import { StartupIdea } from '../types';
import { isAuthenticated, getCurrentUser } from '../utils/auth';
import { addToFavorites, removeFromFavorites, isFavorite } from '../utils/localStorage';
import { generateMarketReportPDF, generateStartupToolkit } from '../utils/pdfGenerator';
import { getUserSubscription } from '../utils/stripe';
import { saveIdeaProgress, loadIdeaProgress } from '../utils/supabaseIdeaGenerator';

interface ProgressStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const defaultSteps: Omit<ProgressStep, 'completed'>[] = [
  {
    id: 'validate',
    title: 'Validate Idea',
    description: 'Research market demand and validate your concept',
    icon: Target
  },
  {
    id: 'research',
    title: 'Market Research',
    description: 'Analyze competitors and target audience',
    icon: TrendingUp
  },
  {
    id: 'mvp',
    title: 'Build MVP',
    description: 'Create minimum viable product',
    icon: Zap
  },
  {
    id: 'launch',
    title: 'Launch',
    description: 'Release your product to the market',
    icon: Star
  },
  {
    id: 'monetize',
    title: 'Monetize',
    description: 'Implement revenue generation strategies',
    icon: DollarSign
  },
  {
    id: 'scale',
    title: 'Scale',
    description: 'Grow and expand your business',
    icon: Trophy
  }
];

const IdeaDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [idea, setIdea] = useState<StartupIdea | null>(null);
  const [steps, setSteps] = useState<ProgressStep[]>([]);
  const [favorited, setFavorited] = useState(false);
  const [isProcessingFavorite, setIsProcessingFavorite] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadAll = async () => {
      let currentUser = user;
      if (!currentUser) {
        currentUser = await getCurrentUser();
        setUser(currentUser);
      }

      const savedIdeas = localStorage.getItem('generatedIdeas');
      if (savedIdeas && id) {
        const ideas: StartupIdea[] = JSON.parse(savedIdeas);
        const foundIdea = ideas.find(i => i.id === id);
        if (foundIdea) {
          setIdea(foundIdea);
          checkFavoriteStatus(foundIdea.id);
        } else {
          navigate('/');
        }
      } else {
        navigate('/');
      }

      if (currentUser) {
        const subscription = await getUserSubscription();
        setIsPremiumUser(subscription?.subscription_status === 'active');
      }
    };

    loadAll();
  }, [id, navigate]);

  useEffect(() => {
    if (idea) {
      loadProgress(idea.id);
    }
  }, [idea, user]);

  const loadProgress = async (ideaId: string) => {
    if (user && user.id) {
      // Try to load from Supabase
      const completedArray = await loadIdeaProgress(user.id, ideaId);
      if (completedArray) {
        const initialSteps = defaultSteps.map((step, idx) => ({
          ...step,
          completed: completedArray[idx] || false,
        }));
        setSteps(initialSteps);
        return;
      }
    }
    // Fallback to localStorage
    const savedProgress = localStorage.getItem(`progress_${ideaId}`);
    if (savedProgress) {
      const completedArray = JSON.parse(savedProgress); // [true, false, ...]
      const initialSteps = defaultSteps.map((step, idx) => ({
        ...step,
        completed: completedArray[idx] || false,
      }));
      setSteps(initialSteps);
    } else {
      const initialSteps = defaultSteps.map(step => ({ ...step, completed: false }));
      setSteps(initialSteps);
    }
  };

  const saveProgress = async (newSteps: ProgressStep[]) => {
    if (idea) {
      const completedArray = newSteps.map(step => step.completed);
      if (user && user.id) {
        await saveIdeaProgress(user.id, idea.id, completedArray);
      } else {
        localStorage.setItem(`progress_${idea.id}`, JSON.stringify(completedArray));
      }
    }
  };

  const checkFavoriteStatus = async (ideaId: string) => {
    const authenticated = await isAuthenticated();
    if (authenticated) {
      const isFav = await isFavorite(ideaId);
      setFavorited(isFav);
    }
  };

  const toggleStep = async (stepId: string) => {
    const stepIndex = steps.findIndex(step => step.id === stepId);
    if (stepIndex === -1) return;

    const canToggle = stepIndex === 0 || steps[stepIndex - 1].completed || steps[stepIndex].completed;
    if (!canToggle) return;

    const newSteps = [...steps];
    if (newSteps[stepIndex].completed) {
      for (let i = stepIndex; i < newSteps.length; i++) {
        newSteps[i].completed = false;
      }
    } else {
      newSteps[stepIndex].completed = true;
    }

    setSteps(newSteps);
    await saveProgress(newSteps);
  };

  const handleFavoriteToggle = async () => {
    if (!idea || isProcessingFavorite) return;

    const authenticated = await isAuthenticated();
    if (!authenticated) {
      alert('Please sign in to save favorites');
      return;
    }

    setIsProcessingFavorite(true);

    try {
      let success = false;
      
      if (favorited) {
        success = await removeFromFavorites(idea.id);
        if (success) setFavorited(false);
      } else {
        success = await addToFavorites(idea);
        if (success) setFavorited(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setIsProcessingFavorite(false);
    }
  };

  const generateIdeaText = () => {
    if (!idea) return '';
    
    return `
      ${idea.title}.
      ${idea.description}
      This is a ${idea.difficulty.toLowerCase()} difficulty project with a market size of ${idea.marketSize}.
      Expected time to market is ${idea.timeToMarket}.
      Revenue Model: ${idea.revenueModel}.
      Target Audience: ${idea.targetAudience}.
      Key Features include: ${idea.keyFeatures.join(', ')}.
      Competitive Advantage: ${idea.competitiveAdvantage}.
    `.trim();
  };

  const handleListenToOverview = async () => {
    if (isPlaying && audio) {
      audio.pause();
      setAudio(null);
      setIsPlaying(false);
      return;
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

      newAudio.onended = () => {
        setIsPlaying(false);
        setAudio(null);
        URL.revokeObjectURL(audioUrl);
      };

      newAudio.onerror = () => {
        setIsPlaying(false);
        setAudio(null);
        URL.revokeObjectURL(audioUrl);
        console.error('Audio playback error');
      };

      setAudio(newAudio);
      await newAudio.play();
      setIsPlaying(true);

    } catch (error) {
      console.error('Error generating audio:', error);
      alert('Failed to generate audio. Please try again.');
      setIsPlaying(false);
      setAudio(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePremiumFeature = async (featureType: 'market-report' | 'startup-toolkit') => {
    if (!idea) return;

    const authenticated = await isAuthenticated();
    if (!authenticated) {
      alert('Please sign in to access premium features');
      return;
    }

    if (!isPremiumUser) {
      alert('This feature requires a premium subscription. Please upgrade to access premium features.');
      return;
    }

    setIsGeneratingPDF(true);
    
    try {
      if (featureType === 'market-report') {
        generateMarketReportPDF(idea);
        setTimeout(() => {
          alert('✅ Deep Market Report generated and downloaded successfully!');
        }, 500);
      } else if (featureType === 'startup-toolkit') {
        generateStartupToolkit(idea);
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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-emerald-700 bg-gradient-to-r from-emerald-100 to-green-100 border-emerald-200';
      case 'Medium': return 'text-amber-700 bg-gradient-to-r from-amber-100 to-yellow-100 border-amber-200';
      case 'Hard': return 'text-red-700 bg-gradient-to-r from-red-100 to-pink-100 border-red-200';
      default: return 'text-gray-700 bg-gradient-to-r from-gray-100 to-gray-200 border-gray-200';
    }
  };

  const completedSteps = steps.filter(step => step.completed).length;
  const progressPercentage = (completedSteps / steps.length) * 100;

  // Check if we came from results page
  const handleBackNavigation = () => {
    // Check if there are generated ideas in localStorage
    const savedIdeas = localStorage.getItem('generatedIdeas');
    if (savedIdeas) {
      const ideas = JSON.parse(savedIdeas);
      if (ideas.length > 0) {
        // Navigate back to home but trigger results view
        navigate('/', { state: { showResults: true } });
        return;
      }
    }
    // Fallback to home
    navigate('/');
  };

  if (!idea) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-purple-400 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="text-gray-600 font-medium">Loading idea details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Enhanced Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-gray-100/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBackNavigation}
              className="inline-flex items-center px-6 py-3 text-gray-600 hover:text-gray-900 transition-all duration-200 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-lg"
            >
              <ArrowLeft size={20} className="mr-3" />
              <span className="font-semibold">Back to Ideas</span>
            </button>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleFavoriteToggle}
                disabled={isProcessingFavorite}
                className={`p-3 rounded-2xl transition-all duration-300 ${
                  isProcessingFavorite 
                    ? 'opacity-50 cursor-not-allowed'
                    : favorited 
                    ? 'text-red-500 bg-gradient-to-r from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100 border border-red-200 shadow-lg' 
                    : 'text-gray-400 hover:text-red-500 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 border border-gray-200 hover:border-red-200 hover:shadow-lg'
                }`}
              >
                <Heart size={24} fill={favorited ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Progress Tracker Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-8 sticky top-24 border border-white/20">
              <div className="text-center mb-8">
                <div className="relative inline-flex items-center justify-center w-16 h-16 mb-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-2xl animate-pulse opacity-75"></div>
                  <div className="relative w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                    <Trophy className="text-white" size={24} />
                  </div>
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  Startup Journey
                </h3>
                <p className="text-gray-600 font-medium">Track your progress step by step</p>
              </div>
              
              {/* Enhanced Progress Bar */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-bold text-gray-700">Overall Progress</span>
                  <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    {completedSteps}/{steps.length}
                  </span>
                </div>
                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-6 shadow-inner">
                    <div 
                      className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-6 rounded-full transition-all duration-700 ease-out relative overflow-hidden shadow-lg"
                      style={{ width: `${progressPercentage}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-white/20 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                    </div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-gray-700">{Math.round(progressPercentage)}%</span>
                  </div>
                </div>
              </div>

              {/* Enhanced Steps List */}
              <div className="space-y-4">
                {steps.map((step, index) => {
                  const IconComponent = step.icon;
                  const canToggle = index === 0 || steps[index - 1].completed || step.completed;
                  const isNext = !step.completed && canToggle;
                  
                  return (
                    <div key={step.id} className="relative">
                      {/* Connecting Line */}
                      {index < steps.length - 1 && (
                        <div className={`absolute left-6 top-16 w-0.5 h-8 transition-all duration-500 ${
                          step.completed ? 'bg-gradient-to-b from-indigo-400 to-purple-400 shadow-lg' : 'bg-gray-200'
                        }`}></div>
                      )}
                      
                      <div className={`relative flex items-start space-x-4 p-4 rounded-2xl transition-all duration-300 cursor-pointer ${
                        isNext ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 shadow-lg transform scale-[1.02]' : 
                        step.completed ? 'bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 shadow-md' : 
                        'bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200'
                      } ${canToggle ? 'hover:shadow-xl hover:scale-[1.02]' : 'cursor-not-allowed opacity-60'}`}
                      onClick={() => canToggle && toggleStep(step.id)}>
                        
                        <div className={`flex-shrink-0 w-12 h-12 rounded-2xl border-2 flex items-center justify-center transition-all duration-300 ${
                          step.completed
                            ? 'bg-gradient-to-br from-emerald-500 to-green-500 border-emerald-400 text-white shadow-xl'
                            : isNext
                            ? 'border-indigo-400 text-indigo-600 bg-gradient-to-br from-white to-indigo-50 shadow-lg'
                            : 'border-gray-300 text-gray-400 bg-gradient-to-br from-gray-100 to-gray-200'
                        }`}>
                          {step.completed ? (
                            <CheckCircle size={20} />
                          ) : (
                            <IconComponent size={18} />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-bold text-base transition-colors duration-300 ${
                            step.completed ? 'text-emerald-800' : 
                            isNext ? 'text-indigo-800' : 'text-gray-600'
                          }`}>
                            {step.title}
                          </h4>
                          <p className={`text-sm mt-1 transition-colors duration-300 ${
                            step.completed ? 'text-emerald-600' : 
                            isNext ? 'text-indigo-600' : 'text-gray-500'
                          }`}>
                            {step.description}
                          </p>
                        </div>
                        
                        {isNext && (
                          <div className="flex-shrink-0">
                            <div className="w-3 h-3 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full animate-pulse shadow-lg"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Enhanced Motivational Message */}
              <div className={`mt-8 p-6 rounded-2xl transition-all duration-300 ${
                completedSteps === steps.length 
                  ? 'bg-gradient-to-r from-emerald-50 via-green-50 to-emerald-50 border-2 border-emerald-200 shadow-xl' 
                  : 'bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-200 shadow-lg'
              }`}>
                <div className="text-center">
                  {completedSteps === 0 && (
                    <>
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                        <Zap className="text-white" size={24} />
                      </div>
                      <p className="text-indigo-700 font-bold text-lg">
                        Ready to start your startup journey?
                      </p>
                      <p className="text-indigo-600 text-sm mt-1">
                        Begin with idea validation!
                      </p>
                    </>
                  )}
                  {completedSteps > 0 && completedSteps < steps.length && (
                    <>
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                        <Star className="text-white" size={24} />
                      </div>
                      <p className="text-indigo-700 font-bold text-lg">
                        Great progress!
                      </p>
                      <p className="text-indigo-600 text-sm mt-1">
                        You're {Math.round(progressPercentage)}% of the way there.
                      </p>
                    </>
                  )}
                  {completedSteps === steps.length && (
                    <>
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                        <Trophy className="text-white" size={24} />
                      </div>
                      <p className="text-emerald-700 font-bold text-lg">
                        🎉 Congratulations!
                      </p>
                      <p className="text-emerald-600 text-sm mt-1">
                        You've completed all startup milestones!
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl overflow-hidden border border-white/20">
              {/* Header */}
              <div className="p-8 pb-6">
                <div className="relative">
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-xl"></div>
                  <h1 className="relative text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">
                    {idea.title}
                  </h1>
                </div>
                <p className="text-xl text-gray-700 leading-relaxed mb-8">{idea.description}</p>

                {/* Audio Overview */}
                <div className="mb-8">
                  <button
                    onClick={handleListenToOverview}
                    disabled={isLoading}
                    className={`inline-flex items-center px-8 py-4 rounded-2xl font-bold transition-all duration-300 ${
                      isLoading
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : isPlaying
                        ? 'bg-gradient-to-r from-red-100 to-pink-100 text-red-600 hover:from-red-200 hover:to-pink-200 border border-red-200 shadow-lg hover:shadow-xl'
                        : 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-600 hover:from-blue-200 hover:to-indigo-200 border border-blue-200 shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <Loader className="animate-spin mr-3" size={24} />
                        Generating Audio...
                      </>
                    ) : isPlaying ? (
                      <>
                        <Pause className="mr-3" size={24} />
                        Stop Overview
                      </>
                    ) : (
                      <>
                        <Play className="mr-3" size={24} />
                        Listen to Overview
                      </>
                    )}
                  </button>
                </div>

                {/* Premium Features */}
                <div className="mb-8 flex flex-wrap gap-4">
                  <button
                    onClick={() => handlePremiumFeature('market-report')}
                    disabled={isGeneratingPDF}
                    className={`inline-flex items-center px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${
                      isGeneratingPDF
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 hover:from-gray-100 hover:to-gray-200 border border-gray-200 hover:border-gray-300 hover:shadow-lg'
                    }`}
                  >
                    {isGeneratingPDF ? (
                      <Loader className="animate-spin mr-3" size={18} />
                    ) : (
                      <>
                        {!isPremiumUser && <Lock className="mr-3" size={18} />}
                        <FileText className="mr-3" size={18} />
                      </>
                    )}
                    Deep Market Report
                    {!isPremiumUser && (
                      <span className="ml-3 inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border border-amber-200">
                        <Crown size={12} className="mr-1" />
                        Premium
                      </span>
                    )}
                  </button>
                  
                  <button
                    onClick={() => handlePremiumFeature('startup-toolkit')}
                    disabled={isGeneratingPDF}
                    className={`inline-flex items-center px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${
                      isGeneratingPDF
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 hover:from-gray-100 hover:to-gray-200 border border-gray-200 hover:border-gray-300 hover:shadow-lg'
                    }`}
                  >
                    {isGeneratingPDF ? (
                      <Loader className="animate-spin mr-3" size={18} />
                    ) : (
                      <>
                        {!isPremiumUser && <Lock className="mr-3" size={18} />}
                        <Briefcase className="mr-3" size={18} />
                      </>
                    )}
                    Startup Toolkit
                    {!isPremiumUser && (
                      <span className="ml-3 inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border border-amber-200">
                        <Crown size={12} className="mr-1" />
                        Premium
                      </span>
                    )}
                  </button>
                </div>

                {/* Enhanced Key Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-emerald-50 to-green-100 p-6 rounded-2xl border border-emerald-200 shadow-lg">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="p-2 bg-emerald-100 rounded-xl">
                        <TrendingUp className="text-emerald-600" size={24} />
                      </div>
                      <span className="text-sm font-bold text-emerald-800 uppercase tracking-wide">Market Size</span>
                    </div>
                    <p className="text-xl font-bold text-emerald-900">{idea.marketSize}</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-2xl border border-blue-200 shadow-lg">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="p-2 bg-blue-100 rounded-xl">
                        <Clock className="text-blue-600" size={24} />
                      </div>
                      <span className="text-sm font-bold text-blue-800 uppercase tracking-wide">Time to Market</span>
                    </div>
                    <p className="text-xl font-bold text-blue-900">{idea.timeToMarket}</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-pink-100 p-6 rounded-2xl border border-purple-200 shadow-lg">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="p-2 bg-purple-100 rounded-xl">
                        <Star className="text-purple-600" size={24} />
                      </div>
                      <span className="text-sm font-bold text-purple-800 uppercase tracking-wide">Difficulty</span>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-sm font-bold border ${getDifficultyColor(idea.difficulty)}`}>
                      {idea.difficulty}
                    </span>
                  </div>
                  
                  <div className="bg-gradient-to-br from-amber-50 to-orange-100 p-6 rounded-2xl border border-amber-200 shadow-lg">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="p-2 bg-amber-100 rounded-xl">
                        <DollarSign className="text-amber-600" size={24} />
                      </div>
                      <span className="text-sm font-bold text-amber-800 uppercase tracking-wide">Revenue Model</span>
                    </div>
                    <p className="text-lg font-bold text-amber-900">{idea.revenueModel}</p>
                  </div>
                </div>

                {/* Enhanced Matching Tags */}
                <div className="flex flex-wrap gap-3 mb-8">
                  {idea.matchingSkills.map((skill) => (
                    <span key={skill} className="px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 text-sm rounded-2xl font-bold border border-indigo-200 shadow-md">
                      {skill}
                    </span>
                  ))}
                  {idea.matchingInterests.map((interest) => (
                    <span key={interest} className="px-4 py-2 bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-800 text-sm rounded-2xl font-bold border border-teal-200 shadow-md">
                      {interest}
                    </span>
                  ))}
                </div>
              </div>

              {/* Enhanced Detailed Sections */}
              <div className="px-8 pb-8 space-y-8">
                {/* Target Audience */}
                <div className="border-t border-gray-200/50 pt-8">
                  <div className="flex items-start space-x-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 shadow-lg">
                    <div className="p-4 bg-blue-100 rounded-2xl">
                      <Users className="text-blue-600" size={32} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-blue-800 mb-4">Target Audience</h3>
                      <p className="text-blue-700 leading-relaxed text-lg">{idea.targetAudience}</p>
                    </div>
                  </div>
                </div>

                {/* Key Features */}
                <div className="border-t border-gray-200/50 pt-8">
                  <div className="flex items-start space-x-6 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200 shadow-lg">
                    <div className="p-4 bg-purple-100 rounded-2xl">
                      <Target className="text-purple-600" size={32} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-purple-800 mb-6">Key Features</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {idea.keyFeatures.map((feature, index) => (
                          <div key={index} className="flex items-center space-x-4 p-4 bg-white/60 rounded-2xl border border-purple-200/50 shadow-md">
                            <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                            <span className="text-purple-700 font-semibold">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Competitive Advantage */}
                <div className="border-t border-gray-200/50 pt-8">
                  <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 p-8 rounded-2xl border border-indigo-200 shadow-xl">
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="p-3 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-2xl">
                        <Sparkles className="text-indigo-600" size={32} />
                      </div>
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        Competitive Advantage
                      </h3>
                    </div>
                    <p className="text-indigo-700 leading-relaxed text-xl font-semibold">{idea.competitiveAdvantage}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdeaDetailPage;
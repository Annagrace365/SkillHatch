import React, { useState, useEffect, useRef } from 'react';
import { Rocket, Heart, RefreshCw, Sparkles, User, LogOut, Crown, Star, Menu, X } from 'lucide-react';
import { UserInput, StartupIdea, User as UserType } from './types';
import { generateStartupIdeasFromSupabase } from './utils/supabaseIdeaGenerator';
import { getFavorites } from './utils/localStorage';
import { getCurrentUser, logout, isAuthenticated } from './utils/auth';
import { getUserSubscription } from './utils/stripe';
import { supabase } from './lib/supabase';
import StartupForm from './components/StartupForm';
import StartupIdeaCard from './components/StartupIdeaCard';
import FavoritesModal from './components/FavoritesModal';
import AuthModal from './components/AuthModal';
import SubscriptionStatus from './components/SubscriptionStatus';
import PremiumUpgradeModal from './components/PremiumUpgradeModal';
import ProceededIdeasModal from './components/ProceededIdeasModal';
import { useNavigate } from 'react-router-dom';

function App() {
  const [currentStep, setCurrentStep] = useState<'form' | 'results'>('form');
  const [generatedIdeas, setGeneratedIdeas] = useState<StartupIdea[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [userInput, setUserInput] = useState<UserInput | null>(null);
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [showPremiumUpgrade, setShowPremiumUpgrade] = useState(false);
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProceeded, setShowProceeded] = useState(false);
  
  // Track currently playing audio across all cards
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Optimize initial load by checking localStorage first
    const checkUserAndLoadData = async () => {
      try {
        // Quick check for existing session without API call
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // User is authenticated, load user data
          const user: UserType = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email || '',
            createdAt: session.user.created_at || new Date().toISOString()
          };
          setUser(user);
          
          // Load data in parallel for better performance
          const [favoritesPromise, subscriptionPromise] = await Promise.allSettled([
            loadFavoritesCount(),
            loadSubscriptionStatus()
          ]);
          
          // Handle any errors silently to not block UI
          if (favoritesPromise.status === 'rejected') {
            console.warn('Failed to load favorites count:', favoritesPromise.reason);
          }
          if (subscriptionPromise.status === 'rejected') {
            console.warn('Failed to load subscription status:', subscriptionPromise.reason);
          }
        }
      } catch (error) {
        console.warn('Error during initial auth check:', error);
        // Don't block the UI for auth errors
      } finally {
        setIsLoadingAuth(false);
      }
    };

    checkUserAndLoadData();

    // Listen for auth state changes (optimized)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const user: UserType = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.email || '',
          createdAt: session.user.created_at || new Date().toISOString()
        };
        setUser(user);
        
        // Load data in background without blocking UI
        Promise.allSettled([
          loadFavoritesCount(),
          loadSubscriptionStatus()
        ]).catch(console.warn);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setFavoritesCount(0);
        setShowFavorites(false);
        setIsPremiumUser(false);
      }
    });

    // Listen for custom showResults event from navigation
    const handleShowResults = () => {
      try {
        const savedIdeas = localStorage.getItem('generatedIdeas');
        if (savedIdeas) {
          const ideas = JSON.parse(savedIdeas);
          if (ideas.length > 0) {
            setGeneratedIdeas(ideas);
            setCurrentStep('results');
          }
        }
      } catch (error) {
        console.warn('Error loading saved ideas:', error);
      }
    };

    window.addEventListener('showResults', handleShowResults);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('showResults', handleShowResults);
    };
  }, []);

  const loadFavoritesCount = async () => {
    try {
      const authenticated = await isAuthenticated();
      if (authenticated) {
        const favorites = await getFavorites();
        setFavoritesCount(favorites.length);
      }
    } catch (error) {
      console.warn('Error loading favorites count:', error);
      // Don't block UI for favorites loading errors
    }
  };

  const loadSubscriptionStatus = async () => {
    try {
      const subscription = await getUserSubscription();
      setIsPremiumUser(subscription?.subscription_status === 'active');
    } catch (error) {
      console.warn('Error loading subscription status:', error);
      // Don't block UI for subscription loading errors
    }
  };

  const stopCurrentAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
  };

  const setCurrentAudio = (audio: HTMLAudioElement | null) => {
    // Stop any existing audio before setting new one
    if (currentAudioRef.current && currentAudioRef.current !== audio) {
      currentAudioRef.current.pause();
    }
    currentAudioRef.current = audio;
  };

  const handleFormSubmit = async (input: UserInput) => {
    // Stop any playing audio when generating new ideas
    stopCurrentAudio();
    
    setIsGenerating(true);
    setGenerationError(null);
    setUserInput(input);
    
    try {
      // Generate ideas from Supabase database
      const ideas = await generateStartupIdeasFromSupabase(input);
      
      if (ideas.length === 0) {
        setGenerationError('No matching startup ideas found. Try adjusting your skills or interests.');
        setCurrentStep('form');
      } else {
        setGeneratedIdeas(ideas);
        setCurrentStep('results');
        
        // Save to localStorage for navigation
        try {
          localStorage.setItem('generatedIdeas', JSON.stringify(ideas));
        } catch (error) {
          console.warn('Failed to save ideas to localStorage:', error);
        }
      }
    } catch (error) {
      console.error('Error generating startup ideas:', error);
      setGenerationError('Failed to generate startup ideas. Please try again.');
      setCurrentStep('form');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateNew = () => {
    // Stop any playing audio when generating new ideas
    stopCurrentAudio();
    
    setCurrentStep('form');
    setGeneratedIdeas([]);
    setGenerationError(null);
    
    // Clear saved ideas
    try {
      localStorage.removeItem('generatedIdeas');
    } catch (error) {
      console.warn('Failed to clear saved ideas:', error);
    }
  };

  const handleRegenerateIdeas = async () => {
    if (!userInput) return;
    
    // Stop any playing audio when regenerating ideas
    stopCurrentAudio();
    
    setIsGenerating(true);
    setGenerationError(null);
    
    try {
      const ideas = await generateStartupIdeasFromSupabase(userInput);
      
      if (ideas.length === 0) {
        setGenerationError('No matching startup ideas found. Try adjusting your skills or interests.');
      } else {
        setGeneratedIdeas(ideas);
        
        // Save to localStorage
        try {
          localStorage.setItem('generatedIdeas', JSON.stringify(ideas));
        } catch (error) {
          console.warn('Failed to save ideas to localStorage:', error);
        }
      }
    } catch (error) {
      console.error('Error regenerating startup ideas:', error);
      setGenerationError('Failed to regenerate startup ideas. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFavoriteChange = () => {
    // Update favorites count in background
    loadFavoritesCount().catch(console.warn);
  };

  const handleAuthSuccess = (authenticatedUser: UserType) => {
    setUser(authenticatedUser);
    // Load data in background
    Promise.allSettled([
      loadFavoritesCount(),
      loadSubscriptionStatus()
    ]).catch(console.warn);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setFavoritesCount(0);
      setShowFavorites(false);
      setIsPremiumUser(false);
    } catch (error) {
      console.error('Logout error:', error);
      // Force cleanup even if logout fails
      setUser(null);
      setFavoritesCount(0);
      setShowFavorites(false);
      setIsPremiumUser(false);
    }
  };

  const handleFavoritesClick = async () => {
    try {
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        setAuthMode('login');
        setShowAuth(true);
      } else {
        setShowFavorites(true);
      }
    } catch (error) {
      console.warn('Error checking authentication:', error);
      setAuthMode('login');
      setShowAuth(true);
    }
  };

  const handleAuthRequired = () => {
    setAuthMode('login');
    setShowAuth(true);
  };

  const handleSignInClick = () => {
    setAuthMode('login');
    setShowAuth(true);
  };

  const handlePremiumClick = () => {
    if (isPremiumUser) {
      // Already premium - could show premium features or account management
      return;
    } else {
      // Show upgrade modal
      setShowPremiumUpgrade(true);
    }
  };

  const handleProceededClick = async () => {
    try {
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        setAuthMode('login');
        setShowAuth(true);
      } else {
        setShowProceeded(true);
      }
    } catch (error) {
      setAuthMode('login');
      setShowAuth(true);
    }
  };

  const handleModalProceed = (ideaId: string) => {
    setShowFavorites(false);
    setShowProceeded(false);
    navigate(`/idea/${ideaId}`);
  };

  // Optimized loading state - show immediately without delay
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-purple-400 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="text-gray-600 font-medium">Loading SkillHatch...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Enhanced Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-gray-100/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo Section */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="p-2.5 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl shadow-lg">
                  <Rocket className="text-white" size={24} />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  SkillHatch
                </h1>
                <p className="text-xs text-gray-500 font-medium">AI-Powered Startup Ideas</p>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <>
                  {/* Subscription Status */}
                  <SubscriptionStatus onUpgradeClick={handlePremiumClick} />

                  {/* User Info */}
                  <div className="flex items-center space-x-3 px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200/50">
                    <div className="p-1.5 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg">
                      <User size={16} className="text-indigo-600" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{user.name}</span>
                  </div>
                  
                  {/* Favorites Button */}
                  <button
                    onClick={handleFavoritesClick}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100 text-red-600 rounded-xl transition-all duration-200 border border-red-200/50 hover:border-red-300/50 hover:shadow-md"
                  >
                    <Heart size={18} />
                    <span className="font-semibold">Favorites</span>
                    {favoritesCount > 0 && (
                      <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                        {favoritesCount}
                      </span>
                    )}
                  </button>
                  
                  {/* Proceeded Ideas Button */}
                  <button
                    onClick={handleProceededClick}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 text-indigo-600 rounded-xl transition-all duration-200 border border-indigo-200/50 hover:border-indigo-300/50 hover:shadow-md"
                  >
                    <Rocket size={18} />
                    <span className="font-semibold">Proceeded</span>
                  </button>
                  
                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 rounded-xl transition-all duration-200 border border-gray-300/50 hover:shadow-md"
                  >
                    <LogOut size={18} />
                    <span className="font-semibold">Logout</span>
                  </button>
                </>
              ) : (
                <>
                  {/* Favorites Button (shows auth modal) */}
                  <button
                    onClick={handleFavoritesClick}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100 text-red-600 rounded-xl transition-all duration-200 border border-red-200/50 hover:border-red-300/50 hover:shadow-md"
                  >
                    <Heart size={18} />
                    <span className="font-semibold">Favorites</span>
                  </button>
                  
                  {/* Login Button */}
                  <button
                    onClick={handleSignInClick}
                    className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <User size={18} />
                    <span className="font-semibold">Sign In</span>
                  </button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200/50">
              <div className="space-y-3">
                {user ? (
                  <>
                    <div className="flex items-center space-x-3 px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                      <User size={16} className="text-indigo-600" />
                      <span className="text-sm font-semibold text-gray-700">{user.name}</span>
                    </div>
                    <SubscriptionStatus onUpgradeClick={handlePremiumClick} />
                    <button
                      onClick={handleFavoritesClick}
                      className="w-full flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-50 to-pink-50 text-red-600 rounded-xl"
                    >
                      <Heart size={18} />
                      <span className="font-semibold">Favorites ({favoritesCount})</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl"
                    >
                      <LogOut size={18} />
                      <span className="font-semibold">Logout</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleFavoritesClick}
                      className="w-full flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-50 to-pink-50 text-red-600 rounded-xl"
                    >
                      <Heart size={18} />
                      <span className="font-semibold">Favorites</span>
                    </button>
                    <button
                      onClick={handleSignInClick}
                      className="w-full flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl"
                    >
                      <User size={18} />
                      <span className="font-semibold">Sign In</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentStep === 'form' ? (
          <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <div className="w-full max-w-2xl">
              <StartupForm onSubmit={handleFormSubmit} isGenerating={isGenerating} />
              
              {/* Enhanced Error Message */}
              {generationError && (
                <div className="mt-8 p-6 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl shadow-lg">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <svg className="h-6 w-6 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-red-800 mb-1">Generation Failed</h3>
                      <p className="text-red-700">{generationError}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Enhanced Results Header */}
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-2xl animate-pulse opacity-75"></div>
                <div className="relative w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <Sparkles className="text-white" size={32} />
                </div>
              </div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
                Your Personalized Startup Ideas
              </h2>
              <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
                Based on your skills and interests, here are <span className="font-semibold text-indigo-600">{generatedIdeas.length} tailored startup opportunities</span> from our curated database
              </p>
              
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={handleRegenerateIdeas}
                  disabled={isGenerating}
                  className="inline-flex items-center px-6 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-lg transition-all duration-200 disabled:opacity-50 font-semibold text-gray-700"
                >
                  {isGenerating ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600 mr-3"></div>
                  ) : (
                    <RefreshCw size={20} className="mr-3" />
                  )}
                  Regenerate Ideas
                </button>
                
                <button
                  onClick={handleGenerateNew}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
                >
                  Generate New
                </button>
              </div>
            </div>

            {/* Enhanced Error Message in Results */}
            {generationError && (
              <div className="max-w-2xl mx-auto p-6 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl shadow-lg">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="h-6 w-6 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-red-800 mb-1">Generation Failed</h3>
                    <p className="text-red-700">{generationError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Loading State */}
            {isGenerating && (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }, (_, i) => (
                  <div key={i} className="bg-white rounded-3xl shadow-xl p-8 animate-pulse border border-gray-100">
                    <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl mb-6"></div>
                    <div className="h-5 bg-gray-200 rounded-lg mb-3"></div>
                    <div className="h-5 bg-gray-200 rounded-lg mb-6 w-3/4"></div>
                    <div className="h-24 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl"></div>
                  </div>
                ))}
              </div>
            )}

            {/* Enhanced Results Grid */}
            {!isGenerating && generatedIdeas.length > 0 && (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                {generatedIdeas.map((idea) => (
                  <StartupIdeaCard
                    key={idea.id}
                    idea={idea}
                    onFavoriteChange={handleFavoriteChange}
                    onAuthRequired={handleAuthRequired}
                    currentAudio={currentAudioRef.current}
                    onAudioChange={setCurrentAudio}
                    isPremiumUser={isPremiumUser}
                    onPremiumRequired={() => setShowPremiumUpgrade(true)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      <FavoritesModal
        isOpen={showFavorites}
        onClose={() => setShowFavorites(false)}
        onFavoriteChange={handleFavoriteChange}
        isPremiumUser={isPremiumUser}
        onPremiumRequired={() => setShowPremiumUpgrade(true)}
        onProceed={handleModalProceed}
      />
      
      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onAuthSuccess={handleAuthSuccess}
        defaultMode={authMode}
      />

      <PremiumUpgradeModal
        isOpen={showPremiumUpgrade}
        onClose={() => setShowPremiumUpgrade(false)}
      />

      <ProceededIdeasModal
        isOpen={showProceeded}
        onClose={() => setShowProceeded(false)}
        isPremiumUser={isPremiumUser}
        onPremiumRequired={() => setShowPremiumUpgrade(true)}
        onProceed={handleModalProceed}
      />
    </div>
  );
}

export default App;
import React, { useState, useEffect, useRef } from 'react';
import { X, Heart, Lock, Sparkles } from 'lucide-react';
import { StartupIdea } from '../types';
import { isAuthenticated } from '../utils/auth';
import { getFavorites } from '../utils/localStorage';
import StartupIdeaCard from './StartupIdeaCard';

interface FavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFavoriteChange: () => void;
  isPremiumUser?: boolean;
  onPremiumRequired?: () => void;
  onProceed?: (ideaId: string) => void;
}

const FavoritesModal: React.FC<FavoritesModalProps> = ({
  isOpen,
  onClose,
  onFavoriteChange,
  isPremiumUser = false,
  onPremiumRequired,
  onProceed
}) => {
  const [favorites, setFavorites] = useState<StartupIdea[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  
  // Track currently playing audio across all cards
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      checkAuthAndLoadFavorites();
    }
  }, [isOpen]);

  const checkAuthAndLoadFavorites = async () => {
    try {
      const authStatus = await isAuthenticated();
      setAuthenticated(authStatus);
      setAuthChecked(true);
      if (authStatus) {
        loadFavorites();
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      setAuthenticated(false);
      setAuthChecked(true);
    }
  };

  const loadFavorites = async () => {
    setIsLoading(true);
    try {
      const userFavorites = await getFavorites();
      setFavorites(userFavorites);
    } catch (error) {
      console.error('Error loading favorites:', error);
      setFavorites([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFavoriteChange = () => {
    loadFavorites();
    onFavoriteChange();
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-white/20">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 to-pink-50/50"></div>
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-red-400/20 to-pink-400/20 rounded-full blur-xl"></div>
        
        {/* Header */}
        <div className="relative flex items-center justify-between p-8 border-b border-gray-200/50">
          <div className="flex items-center space-x-4">
            <div className="relative p-3 bg-gradient-to-br from-red-100 to-pink-100 rounded-2xl">
              <Heart className="text-red-600" size={24} />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                <Sparkles className="text-white" size={8} />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                Your Favorite Ideas
              </h2>
              <p className="text-gray-600 text-sm font-medium">
                {authenticated 
                  ? `${favorites.length} saved startup ideas`
                  : 'Sign in to save and view your favorite ideas'
                }
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="relative p-8 overflow-y-auto max-h-[calc(90vh-140px)]">
          {!authChecked ? (
            <div className="text-center py-16">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-6"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-pink-400 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              </div>
              <p className="text-gray-600 font-medium text-lg">Checking authentication...</p>
            </div>
          ) : !authenticated ? (
            <div className="text-center py-16">
              <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-gray-300 to-gray-400 rounded-2xl opacity-50"></div>
                <div className="relative w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl flex items-center justify-center shadow-xl">
                  <Lock className="text-white" size={32} />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Sign In Required</h3>
              <p className="text-gray-600 mb-6 text-lg max-w-md mx-auto">
                Create an account or sign in to save your favorite startup ideas and access them anytime.
              </p>
              <button
                onClick={onClose}
                className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-bold shadow-lg hover:shadow-xl"
              >
                Close
              </button>
            </div>
          ) : isLoading ? (
            <div className="text-center py-16">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-6"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-pink-400 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              </div>
              <p className="text-gray-600 font-medium text-lg">Loading your favorites...</p>
            </div>
          ) : favorites.length === 0 ? (
            <div className="text-center py-16">
              <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl opacity-50"></div>
                <div className="relative w-16 h-16 bg-gradient-to-br from-gray-300 to-gray-400 rounded-2xl flex items-center justify-center shadow-xl">
                  <Heart className="text-white" size={32} />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No favorites yet</h3>
              <p className="text-gray-600 text-lg">
                Start generating ideas and save your favorites by clicking the heart icon.
              </p>
            </div>
          ) : (
            <div className="grid gap-8">
              {favorites.map((idea) => (
                <StartupIdeaCard
                  key={idea.id}
                  idea={idea}
                  onFavoriteChange={handleFavoriteChange}
                  currentAudio={currentAudioRef.current}
                  onAudioChange={setCurrentAudio}
                  isPremiumUser={isPremiumUser}
                  onPremiumRequired={onPremiumRequired}
                  onProceed={onProceed}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FavoritesModal;
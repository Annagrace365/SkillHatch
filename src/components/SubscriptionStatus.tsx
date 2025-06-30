import React, { useState, useEffect } from 'react';
import { Crown, Loader, AlertCircle, Sparkles } from 'lucide-react';
import { getUserSubscription, SubscriptionData } from '../utils/stripe';
import { getProductByPriceId } from '../stripe-config';

interface SubscriptionStatusProps {
  onUpgradeClick?: () => void;
}

const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({ onUpgradeClick }) => {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getUserSubscription();
      setSubscription(data);
    } catch (err) {
      console.error('Error loading subscription:', err);
      setError('Failed to load subscription status');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-3 px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
        <Loader className="animate-spin text-gray-400" size={18} />
        <span className="text-sm text-gray-600 font-medium">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center space-x-3 px-4 py-2 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-200">
        <AlertCircle className="text-red-500" size={18} />
        <span className="text-sm text-red-600 font-medium">Error loading subscription</span>
      </div>
    );
  }

  const isActive = subscription?.subscription_status === 'active';
  const product = subscription?.price_id ? getProductByPriceId(subscription.price_id) : null;

  if (isActive && product) {
    return (
      <div className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-2xl shadow-xl border border-amber-300">
        <div className="relative">
          <Crown size={20} />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-300 rounded-full animate-pulse"></div>
        </div>
        <span className="font-bold">{product.name}</span>
        <Sparkles size={16} className="animate-pulse" />
      </div>
    );
  }

  return (
    <button
      onClick={onUpgradeClick}
      className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 hover:from-amber-200 hover:to-orange-200 rounded-2xl transition-all duration-300 border border-amber-200 hover:border-amber-300 hover:shadow-lg font-semibold"
    >
      <Crown size={20} />
      <span>Upgrade to Premium</span>
      <Sparkles size={16} />
    </button>
  );
};

export default SubscriptionStatus;
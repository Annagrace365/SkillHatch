import React, { useState } from 'react';
import { Crown, X, Loader, CheckCircle, Download, FileText, Briefcase, Sparkles, Zap } from 'lucide-react';
import { createCheckoutSession } from '../utils/stripe';
import { stripeProducts } from '../stripe-config';

interface PremiumUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PremiumUpgradeModal: React.FC<PremiumUpgradeModalProps> = ({ isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const startupProPlan = stripeProducts.find(p => p.name === 'StartupPro Plan');

  const handleUpgrade = async () => {
    if (!startupProPlan) {
      setError('Product not found');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { url } = await createCheckoutSession({
        priceId: startupProPlan.priceId,
        mode: startupProPlan.mode,
        successUrl: `${window.location.origin}/success`,
        cancelUrl: window.location.href,
      });

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (err) {
      console.error('Error creating checkout session:', err);
      setError(err instanceof Error ? err.message : 'Failed to start checkout process');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-white/20">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-orange-50/50"></div>
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-amber-400/20 to-orange-400/20 rounded-full blur-xl"></div>
        
        {/* Header with Close Button */}
        <div className="relative p-8 pb-6">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200"
            disabled={isLoading}
          >
            <X size={24} className="text-gray-500" />
          </button>
          
          <div className="text-center pr-12">
            <div className="relative inline-flex items-center justify-center w-24 h-24 mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-400 rounded-3xl animate-pulse opacity-75"></div>
              <div className="relative w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl flex items-center justify-center shadow-xl">
                <Crown className="text-white" size={40} />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                <Sparkles className="text-white" size={16} />
              </div>
            </div>
            <h3 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-3">
              Upgrade to Premium
            </h3>
            <p className="text-gray-600 text-xl leading-relaxed">
              Unlock powerful tools to turn your startup ideas into reality
            </p>
          </div>
        </div>
        
        {/* Content */}
        <div className="relative px-8 pb-8">
          {/* Features */}
          <div className="space-y-6 mb-8 text-left">
            <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl border border-emerald-200">
              <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h4 className="font-bold text-emerald-800 text-lg mb-1">Deep Market Analysis Reports</h4>
                <p className="text-emerald-700 text-sm leading-relaxed">Comprehensive PDF reports with market research, competitive analysis, and financial projections</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-bold text-blue-800 text-lg mb-1">Professional Startup Toolkit</h4>
                <p className="text-blue-700 text-sm leading-relaxed">Pitch deck templates, business plan outlines, and landing page designs</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-2xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h4 className="font-bold text-purple-800 text-lg mb-1">Priority Support</h4>
                <p className="text-purple-700 text-sm leading-relaxed">Get help from our startup experts and access exclusive resources</p>
              </div>
            </div>
          </div>
          
          {/* Pricing */}
          {startupProPlan && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 mb-8 border border-amber-200">
              <div className="flex items-center justify-center space-x-3 mb-3">
                <span className="text-3xl font-bold text-amber-800">₹149</span>
                <span className="text-amber-600 font-semibold">/month</span>
                <div className="px-3 py-1 bg-amber-200 text-amber-800 rounded-full text-xs font-bold">
                  BEST VALUE
                </div>
              </div>
              <p className="text-amber-700 text-sm text-center font-medium">Cancel anytime • 7-day free trial</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl">
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-6 py-4 border-2 border-gray-300 rounded-2xl text-gray-700 hover:bg-gray-50 transition-all duration-300 font-bold disabled:opacity-50"
            >
              Maybe Later
            </button>
            <button
              onClick={handleUpgrade}
              disabled={isLoading || !startupProPlan}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:via-orange-600 hover:to-amber-700 text-white rounded-2xl transition-all duration-300 font-bold shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader className="animate-spin mr-3" size={20} />
                  Processing...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Zap className="mr-3" size={20} />
                  Start Free Trial
                  <Sparkles className="ml-3" size={20} />
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumUpgradeModal;
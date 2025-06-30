import React, { useEffect, useState } from 'react';
import { CheckCircle, Crown, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getUserSubscription, SubscriptionData } from '../utils/stripe';
import { getProductByPriceId } from '../stripe-config';

const SuccessPage: React.FC = () => {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Wait a moment for webhook to process, then check subscription status
    const timer = setTimeout(async () => {
      try {
        const data = await getUserSubscription();
        setSubscription(data);
      } catch (error) {
        console.error('Error loading subscription:', error);
      } finally {
        setIsLoading(false);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const product = subscription?.price_id ? getProductByPriceId(subscription.price_id) : null;
  const isActive = subscription?.subscription_status === 'active';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Success Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl mb-6">
            <CheckCircle className="text-white" size={40} />
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Payment Successful!
          </h1>

          {isLoading ? (
            <div className="mb-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
              </div>
            </div>
          ) : isActive && product ? (
            <div className="mb-6">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Crown className="text-amber-500" size={24} />
                <span className="text-xl font-semibold text-gray-900">{product.name}</span>
              </div>
              <p className="text-gray-600">
                Welcome to premium! You now have access to all premium features including market reports and startup toolkits.
              </p>
            </div>
          ) : (
            <div className="mb-6">
              <p className="text-gray-600">
                Thank you for your purchase! Your payment has been processed successfully.
              </p>
            </div>
          )}

          {/* Premium Features */}
          {isActive && (
            <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl p-4 mb-6">
              <h3 className="font-semibold text-amber-800 mb-2">Premium Features Unlocked:</h3>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>✓ Deep Market Analysis Reports</li>
                <li>✓ Professional Startup Toolkits</li>
                <li>✓ Priority Support</li>
                <li>✓ Advanced Business Templates</li>
              </ul>
            </div>
          )}

          {/* Action Button - Return to Dashboard */}
          <div className="space-y-3">
            <Link
              to="/"
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all font-medium shadow-lg"
            >
              <Home className="mr-2" size={18} />
              Return to Dashboard
            </Link>
          </div>

          {/* Support */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Need help? Contact our support team at{' '}
              <a href="mailto:support@skillhatch.com" className="text-purple-600 hover:underline">
                support@skillhatch.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage;
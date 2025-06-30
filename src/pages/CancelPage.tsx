import React from 'react';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

const CancelPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Cancel Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl mb-6">
            <XCircle className="text-white" size={40} />
          </div>

          {/* Cancel Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Payment Cancelled
          </h1>

          <p className="text-gray-600 mb-6">
            No worries! Your payment was cancelled and no charges were made to your account. 
            You can try again anytime or continue using our free features.
          </p>

          {/* Features Still Available */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-blue-800 mb-2">Still Available for Free:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>✓ Personalized Startup Ideas</li>
              <li>✓ Basic Market Information</li>
              <li>✓ Idea Favorites & Saving</li>
              <li>✓ Audio Overviews</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              to="/"
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all font-medium shadow-lg"
            >
              <ArrowLeft className="mr-2" size={18} />
              Back to Dashboard
            </Link>

            <button
              onClick={() => window.history.back()}
              className="w-full inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <RefreshCw className="mr-2" size={18} />
              Try Again
            </button>
          </div>

          {/* Support */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Questions about premium features? Contact us at{' '}
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

export default CancelPage;
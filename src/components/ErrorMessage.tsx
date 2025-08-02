'use client';

import { useState } from 'react';

interface ErrorMessageProps {
  error: string;
  details?: string | null;
  onRetry?: () => void;
}

export default function ErrorMessage({ error, details, onRetry }: ErrorMessageProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getErrorIcon = (error: string) => {
    if (error.toLowerCase().includes('rate limit')) {
      return (
        <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    if (error.toLowerCase().includes('file') || error.toLowerCase().includes('upload')) {
      return (
        <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      );
    }
    if (error.toLowerCase().includes('network') || error.toLowerCase().includes('connection')) {
      return (
        <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z" />
        </svg>
      );
    }
    return (
      <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  const getErrorColor = (error: string) => {
    if (error.toLowerCase().includes('rate limit')) {
      return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
    }
    return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
  };

  const getErrorTextColor = (error: string) => {
    if (error.toLowerCase().includes('rate limit')) {
      return 'text-orange-800 dark:text-orange-200';
    }
    return 'text-red-800 dark:text-red-200';
  };

  const getErrorDescriptionColor = (error: string) => {
    if (error.toLowerCase().includes('rate limit')) {
      return 'text-orange-700 dark:text-orange-300';
    }
    return 'text-red-700 dark:text-red-300';
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className={`${getErrorColor(error)} border rounded-lg p-6`}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {getErrorIcon(error)}
          </div>
          
          <div className="flex-1">
            <h3 className={`text-lg font-medium ${getErrorTextColor(error)}`}>
              {error}
            </h3>
            
            {details && (
              <div className="mt-2">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                  aria-expanded={showDetails}
                  aria-controls="error-details"
                >
                  {showDetails ? 'Hide' : 'Show'} technical details
                </button>
                {showDetails && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 p-3 rounded-lg" id="error-details">
                    {details}
                  </p>
                )}
              </div>
            )}

            {error.toLowerCase().includes('rate limit') && (
              <div className="mt-3 p-3 bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 rounded-lg">
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  <strong>Tip:</strong> Wait a minute before trying again, or try uploading a smaller image file.
                </p>
              </div>
            )}

            {error.toLowerCase().includes('file') && (
              <div className="mt-3 p-3 bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Tip:</strong> Make sure your image is clear, well-lit, and shows all class information. Try taking a new screenshot.
                </p>
              </div>
            )}

            {error.toLowerCase().includes('network') && (
              <div className="mt-3 p-3 bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Tip:</strong> Check your internet connection and try again. If the problem persists, try refreshing the page.
                </p>
              </div>
            )}
            
            {onRetry && (
              <div className="mt-4">
                <button
                  onClick={onRetry}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 dark:text-red-200 dark:bg-red-800 dark:hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
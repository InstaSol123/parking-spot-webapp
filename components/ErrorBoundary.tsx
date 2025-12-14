import React, { useState } from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

// Functional component - React 19 uses this pattern instead of class ErrorBoundary
export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Note: In React 19, error boundaries functionality is limited.
  // This component provides error UI, but you may need to use React.lazy
  // with Suspense for better error handling in React 19.

  const handleReset = () => {
    setHasError(false);
    setError(null);
  };

  if (hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="flex justify-center mb-6">
              <div className="bg-red-100 p-4 rounded-full">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-center text-slate-900 mb-4">
              Oops! Something Went Wrong
            </h1>

            <p className="text-slate-600 text-center mb-6">
              An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
            </p>

            {process.env.NODE_ENV === 'development' && error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 max-h-40 overflow-auto">
                <p className="text-xs font-mono text-red-700 break-words">
                  {error.message}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 bg-sky-500 text-white py-3 rounded-lg font-semibold hover:bg-sky-600 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCw className="w-4 h-4" />
                Try Again
              </button>

              <button
                onClick={() => window.location.href = '/#/'}
                className="flex-1 bg-slate-200 text-slate-900 py-3 rounded-lg font-semibold hover:bg-slate-300 transition-colors"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return children;
}

export default ErrorBoundary;

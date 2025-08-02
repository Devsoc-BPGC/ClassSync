'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import FileUpload from '../components/FileUpload';
import TimetableDisplay from '../components/TimetableDisplay';
import ErrorMessage from '../components/ErrorMessage';
import ProtectedRoute from '../components/ProtectedRoute';

interface ClassSession {
  day: string;
  start_time: string;
  end_time: string;
  course_code: string;
  course_name: string;
  class_type: string;
  location: string;
  instructor: string;
}

export default function Home() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [timetableData, setTimetableData] = useState<ClassSession[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setErrorDetails(null);
    setTimetableData(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/parse-timetable', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process timetable');
      }

      if (result.success) {
        setTimetableData(result.data);
      } else {
        throw new Error(result.error || 'Failed to process timetable');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      if (err instanceof Error && 'details' in err) {
        setErrorDetails((err as any).details);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setErrorDetails(null);
    setTimetableData(null);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <header className="glass border-b border-white/20 dark:border-gray-700/50 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold gradient-text">
                      ClassSync
                    </h1>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      Timetable Manager
                    </span>
                  </div>
                </div>
              </div>
              
              {session && (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 bg-white/50 dark:bg-gray-800/50 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                    <img
                      src={session.user?.image || ''}
                      alt="Profile"
                      className="w-6 h-6 rounded-full ring-2 ring-white/50 dark:ring-gray-600/50"
                    />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {session.user?.name}
                    </span>
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                    className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-all duration-200 border border-gray-200/50 dark:border-gray-600/50 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50 backdrop-blur-sm hover:shadow-md"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {!timetableData && (
            <div className="text-center space-y-6 animate-fade-in-up">
              <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                  <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl mx-auto">
                    Transform your timetable screenshots into structured, editable data. 
                    Sync with Google Calendar and manage your schedule effortlessly.
                  </p>
                </div>
              </div>

              <div className="max-w-2xl mx-auto bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 dark:border-gray-700/50">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-base flex items-center">
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Before uploading, please ensure:
                </h3>
                <ol className="space-y-3 text-left">
                  <li className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300 pt-0.5">Turn off "Show AM/PM" in your ERP before taking a screenshot</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300 pt-0.5">Take a clear screenshot of your full timetable</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300 pt-0.5">Ensure all class information is visible and readable</span>
                  </li>
                </ol>
              </div>

              <div className="max-w-2xl mx-auto animate-slide-in-right">
                <FileUpload onFileUpload={handleFileUpload} isLoading={isLoading} />
              </div>
            </div>
          )}

          {error && (
            <div className="max-w-2xl mx-auto animate-fade-in-up">
              <ErrorMessage 
                error={error} 
                details={errorDetails} 
                onRetry={handleRetry}
              />
            </div>
          )}

          {timetableData && (
            <div className="space-y-6 animate-fade-in-up">
              <TimetableDisplay 
                data={timetableData} 
                onDataChange={setTimetableData}
              />
              
              <div className="text-center">
                <button
                  onClick={handleRetry}
                  className="inline-flex items-center px-6 py-3 border-2 border-gray-300/50 dark:border-gray-600/50 text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 font-semibold rounded-xl transition-all duration-200 hover:shadow-lg backdrop-blur-sm hover-lift"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Upload Another Timetable
                </button>
              </div>
            </div>
          )}
          </div>
        </main>

        <footer className="mt-8 pb-4 text-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-white/20 dark:border-gray-700/50">
              <p className="text-gray-600 dark:text-gray-400 text-base font-medium">
                Made with ❤️ by DevSoc
              </p>
            </div>
          </div>
        </footer>
      </div>
    </ProtectedRoute>
  );
}

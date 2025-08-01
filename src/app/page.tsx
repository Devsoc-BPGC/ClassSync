'use client';

import { useState } from 'react';
import FileUpload from '../components/FileUpload';
import TimetableDisplay from '../components/TimetableDisplay';
import ErrorMessage from '../components/ErrorMessage';

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">


      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {!timetableData && (
            <div className="text-center space-y-6">
              <div className="max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  AutoSched
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                  Upload a screenshot of your class timetable. 
                  Get structured data you can use anywhere.
                </p>
              </div>

              <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-lg">Before uploading, please ensure:</h3>
                <ol className="space-y-3 text-left">
                  <li className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center text-sm font-medium">1</span>
                    <span className="text-gray-700 dark:text-gray-300">Turn off "Show AM/PM" in your timetable settings</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center text-sm font-medium">2</span>
                    <span className="text-gray-700 dark:text-gray-300">Take a clear screenshot of your full timetable</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center text-sm font-medium">3</span>
                    <span className="text-gray-700 dark:text-gray-300">Ensure all class information is visible and readable</span>
                  </li>
                </ol>
              </div>

              <div className="max-w-2xl mx-auto">
                <FileUpload onFileUpload={handleFileUpload} isLoading={isLoading} />
              </div>
            </div>
          )}

          {error && (
            <div className="max-w-2xl mx-auto">
              <ErrorMessage 
                error={error} 
                details={errorDetails} 
                onRetry={handleRetry}
              />
            </div>
          )}

          {timetableData && (
            <div className="space-y-6">
              <TimetableDisplay 
                data={timetableData} 
                onDataChange={setTimetableData}
              />
              
              <div className="text-center">
                <button
                  onClick={handleRetry}
                  className="inline-flex items-center px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold rounded-xl transition-all duration-200 hover:shadow-md"
                >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Upload Another Timetable
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <div className="mt-12 pb-6 text-center">
        <p className="text-gray-400 dark:text-gray-500 text-lg">
          Made with ❤️ by DevSoc
        </p>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';

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

interface GoogleCalendarSyncProps {
  classes: ClassSession[];
}

export default function GoogleCalendarSync({ classes }: GoogleCalendarSyncProps) {
  const { data: session, status } = useSession();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    message: string;
    events?: any[];
  } | null>(null);

  const handleSyncToCalendar = async () => {
    if (!session) {
      await signIn('google');
      return;
    }

    setIsSyncing(true);
    setSyncResult(null);

    try {
      const response = await fetch('/api/calendar/add-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ classes }),
      });

      const result = await response.json();

      if (response.ok) {
        setSyncResult({
          success: true,
          message: result.message,
          events: result.events,
        });
      } else {
        setSyncResult({
          success: false,
          message: result.error || 'Failed to sync with Google Calendar',
        });
      }
    } catch (error) {
      setSyncResult({
        success: false,
        message: 'Network error occurred while syncing',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto mb-8">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Google Calendar Sync
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Add all your classes to Google Calendar with one click
            </p>
          </div>
          
          {session ? (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <img
                  src={session.user?.image || ''}
                  alt="Profile"
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {session.user?.name}
                </span>
              </div>
              <button
                onClick={() => signOut()}
                className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : null}
        </div>

        {!session ? (
          <div className="text-center py-6">
            <div className="mb-4">
              <svg className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Sign in with Google to sync your timetable
              </p>
            </div>
            <button
              onClick={() => signIn('google')}
              className="inline-flex items-center px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg border border-gray-300 shadow-sm transition-colors"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-1">
                    Ready to Sync
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    This will add {classes.length} recurring events to your Google Calendar. 
                    Events will repeat weekly for 15 weeks (typical semester length).
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleSyncToCalendar}
              disabled={isSyncing || classes.length === 0}
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors shadow-sm hover:shadow-md"
            >
              {isSyncing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Syncing to Calendar...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Add {classes.length} Classes to Google Calendar
                </>
              )}
            </button>

            {syncResult && (
              <div className={`rounded-lg p-4 ${
                syncResult.success 
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700' 
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700'
              }`}>
                <div className="flex items-start space-x-3">
                  <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                    syncResult.success 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {syncResult.success ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    )}
                  </svg>
                  <div>
                    <h4 className={`text-sm font-semibold mb-1 ${
                      syncResult.success 
                        ? 'text-green-800 dark:text-green-200' 
                        : 'text-red-800 dark:text-red-200'
                    }`}>
                      {syncResult.success ? 'Sync Successful' : 'Sync Failed'}
                    </h4>
                    <p className={`text-sm ${
                      syncResult.success 
                        ? 'text-green-700 dark:text-green-300' 
                        : 'text-red-700 dark:text-red-300'
                    }`}>
                      {syncResult.message}
                    </p>
                    {syncResult.success && syncResult.events && (
                      <div className="mt-3">
                        <p className="text-xs text-green-600 dark:text-green-400 mb-2">
                          Added events:
                        </p>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {syncResult.events.map((event, index) => (
                            <div key={index} className="text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
                              {event.summary}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 
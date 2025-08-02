'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      setIsRedirecting(true);
      const timeout = setTimeout(() => {
        router.push('/auth/signin');
      }, 100);
      
      return () => clearTimeout(timeout);
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session?.expires) {
      const expirationTime = new Date(session.expires).getTime();
      const currentTime = Date.now();
      
      if (currentTime >= expirationTime) {
        setIsRedirecting(true);
        router.push('/auth/signin?error=SessionExpired');
      }
    }
  }, [session, router]);

  if (status === 'loading' || isRedirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            {isRedirecting ? 'Redirecting to sign in...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
} 
'use client'

/**
 * App Loading Wrapper Component
 * 
 * Shows a loading page during initial app authentication state loading.
 * This prevents flashing content before auth state is determined.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LoadingPage from './LoadingPage';

interface AppLoadingWrapperProps {
  children: React.ReactNode;
}

const AppLoadingWrapper: React.FC<AppLoadingWrapperProps> = ({ children }) => {
  const { isLoading } = useAuth();
  const [forceShowContent, setForceShowContent] = useState(false);

  // Shorter timeout to prevent hanging in any environment
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        console.log('🔍 [APP_LOADING_WRAPPER] Forcing content display due to loading timeout');
        setForceShowContent(true);
      }, 2000); // Reduced to 2 seconds
      
      return () => clearTimeout(timer);
    } else {
      setForceShowContent(false);
    }
  }, [isLoading]);

  if (isLoading && !forceShowContent) {
    return (
      <LoadingPage
        title="Initializing"
        message="Setting up your session..."
        variant="authentication"
      />
    );
  }

  return <>{children}</>;
};

export default AppLoadingWrapper;
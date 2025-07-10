import React, { useState, useEffect } from 'react';

interface PreloaderProps {
  children: React.ReactNode;
}

const Preloader: React.FC<PreloaderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleLoad = () => setIsLoading(false);
    window.addEventListener('load', handleLoad);
    return () => window.removeEventListener('load', handleLoad);
  }, []);

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-75">
        <div className="flex flex-col items-center">
          <img src="/Dots loader.gif" alt="Loading..." className="h-24 w-24" />
          <p className="mt-4 text-white text-lg">Loading Website...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default Preloader;
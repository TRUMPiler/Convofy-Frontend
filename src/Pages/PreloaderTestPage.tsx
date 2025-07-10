// src/Pages/PreloaderTestPage.tsx
import React, { useState, useEffect } from 'react';

const PreloaderTestPage: React.FC = () => {
  const [contentLoaded, setContentLoaded] = useState(false);

  useEffect(() => {
    // Simulate a heavy page load by delaying the content display
    const timer = setTimeout(() => {
      setContentLoaded(true);
    }, 4000); // Display content after 4 seconds

    // Clean up the timer if the component unmounts
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-4xl font-bold text-gray-800 mb-6">Preloader Test Page</h1>
      {contentLoaded ? (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <p className="text-xl text-gray-700">
            🎉 **Content has loaded!** 🎉
          </p>
          <p className="mt-4 text-gray-600">
            If you saw the "Loading Website..." preloader before this message, your preloader is working.
          </p>
          <p className="mt-2 text-gray-600">
            This page simulates a delayed content load to demonstrate the preloader's function.
          </p>
        </div>
      ) : (
        <div className="text-lg text-gray-500">
          <p>Simulating content loading...</p>
        </div>
      )}
    </div>
  );
};

export default PreloaderTestPage;
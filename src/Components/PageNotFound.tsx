import React from 'react';
import { Link } from 'react-router-dom'; // Import Link for navigation

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-gray-800 p-4">
      <div className="text-center">
        <h1 className="text-9xl font-extrabold text-red-600">404</h1>
        <p className="text-3xl font-semibold mt-4 mb-2">Page Not Found</p>
        <p className="text-lg text-gray-600 mb-8">
          Oops! The page you're looking for doesn't exist.
        </p>
        <Link
          to="/" // Link back to your home/dashboard page
          className="inline-block bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow-md
                     hover:bg-blue-700 transition-colors duration-300 transform hover:scale-105
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
        >
          Go to Homepage
        </Link>
      </div>
    </div>
  );
};

export default NotFound;

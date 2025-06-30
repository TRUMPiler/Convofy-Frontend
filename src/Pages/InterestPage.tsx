// src/pages/InterestsPage.tsx
import React, { useState, useEffect } from 'react';
import Navbar from './Sub-parts/NavigationBar';
import axios from 'axios';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

// Define the structure for an Interest object received from the backend
interface Interest {
  interestId: string; // UUID from backend
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

const InterestsPage: React.FC = () => {
  const [availableInterests, setAvailableInterests] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate(); // Initialize useNavigate

  // Fetch interests from the backend when the component mounts
  useEffect(() => {
    const fetchInterests = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get('https://api.convofy.fun/api/interests?status=ACTIVE');
        if (response.data.success) {
          setAvailableInterests(response.data.data);
        } else {
          setError(response.data.message || 'Failed to fetch interests.');
          toast.error(response.data.message || 'Failed to fetch interests.');
        }
      } catch (err: any) {
        console.error('Error fetching interests:', err);
        setError('An error occurred while fetching interests. Please try again later.');
        toast.error('An error occurred while fetching interests.');
      } finally {
        setLoading(false);
      }
    };

    fetchInterests();
  }, []);

  const handleInterestClick = (interest: Interest) => {
    // Navigate to the dynamic chatroom URL using the interestId
    console.log(`Navigating to chatroom for Interest ID: ${interest.interestId}, Name: ${interest.name}`);
    navigate(`/ChatRoom/${interest.interestId}`);
  };

  return (
    <div className="min-h-screen bg-background-primary text-text-base flex flex-col">
      <Navbar />

      <main className="container mx-auto p-8 flex-grow flex flex-col items-center justify-center pt-24">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-10 text-center text-ui-primary drop-shadow-lg">
          Discover Your Convofy Tribe
        </h1>

        <p className="text-lg md:text-xl text-text-secondary mb-12 text-center max-w-2xl">
          Select an interest below to connect with people who share your passions.
        </p>

        {loading && (
          <div className="text-text-secondary text-xl">Loading interests...</div>
        )}

        {error && (
          <div className="text-error text-xl p-4 rounded-md bg-red-900 bg-opacity-30 border border-error">
            Error: {error}
          </div>
        )}

        {!loading && !error && availableInterests.length === 0 && (
          <div className="text-text-secondary text-xl">No active interests available. Please check back later.</div>
        )}

        {!loading && !error && availableInterests.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl w-full">
            {availableInterests.map((interest) => (
              <button
                key={interest.interestId}
                onClick={() => handleInterestClick(interest)}
                className="bg-background-secondary hover:bg-ui-primary transition duration-300 ease-in-out
                           text-text-base font-semibold py-4 px-6 rounded-xl shadow-lg
                           transform hover:scale-105 focus:outline-none focus:ring-4
                           focus:ring-accent-main focus:ring-opacity-75 flex items-center justify-center text-lg"
              >
                {interest.name}
              </button>
            ))}
          </div>
        )}
      </main>

      <footer className="p-4 text-center text-text-secondary text-sm">
        &copy; {new Date().getFullYear()} Convofy. All rights reserved.
      </footer>
    </div>
  );
};

export default InterestsPage;
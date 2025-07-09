// src/utils/api.ts (Create a new file for API utility functions, or place it in a relevant existing one)

import axios from 'axios';

// Define the structure for an Interest object received from the backend
interface InterestDetails {
  interestId: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export const fetchInterestNameById = async (interestId: string): Promise<string | null> => {
  try {
    const response = await axios.get(`https://api.convofy.fun/api/interests/${interestId}`);
    if (response.data.success && response.data.data) {
      return response.data.data.name; // Return the interest name
    } else {
      console.error('Failed to fetch interest details:', response.data.message);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching interest name for ID ${interestId}:`, error);
    return null;
  }
};
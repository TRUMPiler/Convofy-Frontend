import React from "react";
import JoinMeeting from "./JoinMeetingPage"; // Corrected import path

// This component acts as the top-level entry for your video call feature.
// It will typically be mapped to a route like /call/:meetid in your App.tsx.
const Testing: React.FC = () => {
  return (
    <div className="w-full h-screen bg-gray-900 text-white">
      <JoinMeeting />
    </div>
  );
};

export default Testing;

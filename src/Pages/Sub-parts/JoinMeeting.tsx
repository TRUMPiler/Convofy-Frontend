import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const JoinScreen: React.FC = () => {
  const [meetingId, setMeetingId] = useState<string>("");
  const navigate = useNavigate();

  const handleJoin = () => {
    if (meetingId) {
      navigate(`/join/${meetingId}`);
    } else {
      alert("Please enter a valid meeting ID");
    }
  };

  return (
    <div>
      <h1>Join a Meeting</h1>
      <input
        type="text"
        placeholder="Enter Meeting ID"
        value={meetingId}
        onChange={(e) => setMeetingId(e.target.value)}
      />
      <button onClick={handleJoin}>Join Meeting</button>
    </div>
  );
};

export default JoinScreen;

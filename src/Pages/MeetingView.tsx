import React, { useState } from "react";
import { useMeeting } from "@videosdk.live/react-sdk";
import ParticipantView from "./Sub-parts/ParticipantView";

const MeetingView: React.FC<{ meetingId: string; onMeetingLeave: () => void }> = ({ meetingId, onMeetingLeave }) => {
  const [joined, setJoined] = useState<string | null>(null);
  const { join, leave, participants } = useMeeting({
    onMeetingJoined: () => setJoined("JOINED"),
    onMeetingLeft: () => onMeetingLeave(),
  });

  const joinMeeting = () => {
    setJoined("JOINING");
    join();
  };

  return (
    <div>
      <h3>Meeting ID: {meetingId}</h3>
      {joined === "JOINED" ? (
        <>
          <div>
            {[...participants.keys()].map((participantId) => (
              <ParticipantView key={participantId} participantId={participantId} />
            ))}
          </div>
          <button onClick={leave}>Leave Meeting</button>
        </>
      ) : joined === "JOINING" ? (
        <p>Joining meeting...</p>
      ) : (
        <button onClick={joinMeeting}>Join Meeting</button>
      )}
    </div>
  );
};

export default MeetingView;

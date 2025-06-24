import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MeetingProvider, useMeeting } from "@videosdk.live/react-sdk";
import Cookies from "js-cookie";
import ParticipantView from "./Sub-parts/ParticipantView";
import { authToken } from "./Sub-parts/MeetComponents";
import { toast } from "sonner";

 const JoinMeetingPage: React.FC = () => {
  const { meetid } = useParams<{ meetid: string }>();
  const navigate = useNavigate();
  const [validMeetingId, setValidMeetingId] = useState<boolean>(true);

  useEffect(() => {
    if (!meetid) {
      setValidMeetingId(false);
      toast.error("Meeting ID is missing!");
      navigate("/");
    }
  }, [meetid, navigate]);

  if (!validMeetingId) return null;

  return (
    <MeetingProvider
      config={{
        meetingId: meetid as string,
        micEnabled: true,
        webcamEnabled: true,
        name: Cookies.get("name") || "Guest",
        debugMode: true,
      }}
      token={authToken}
    >
      <MeetingView meetingId={meetid!} onMeetingLeave={() => navigate("/")} />
    </MeetingProvider>
  );
};

const MeetingView: React.FC<{ meetingId: string; onMeetingLeave: () => void }> = ({ meetingId, onMeetingLeave }) => {
  const [joined, setJoined] = useState(false);
  const { join, leave, participants } = useMeeting({
    onMeetingJoined: () => setJoined(true),
    onMeetingLeft: onMeetingLeave,
  });

  useEffect(() => {
    join(); // Auto-join the meeting
  }, [join]);

  if (!joined) {
    return <p>Joining meeting...</p>;
  }

  return (
    <div>
      <h3>Meeting ID: {meetingId}</h3>
      <div>
        {[...participants.keys()].map((participantId) => (
          <ParticipantView key={participantId} participantId={participantId} />
        ))}
      </div>
      <button onClick={leave}>Leave Meeting</button>
    </div>
  );
};

export default JoinMeetingPage;

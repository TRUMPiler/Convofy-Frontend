import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MeetingProvider } from "@videosdk.live/react-sdk";
import MeetingView from "./MeetingView";
import JoinScreen from "./Sub-parts/JoinMeeting";
import { authToken, createMeeting } from "./Sub-parts/MeetComponents";
import Cookies from "js-cookie";

const Testing: React.FC = () => {
  return (
    <>
      <CreateMeeting />
      <JoinMeeting />
    </>
  );
};

const CreateMeeting: React.FC = () => {
  const [meetingId, setMeetingId] = React.useState<string | null>(null);

  const handleCreateMeeting = async () => {
    const id = await createMeeting({ token: authToken });
    setMeetingId(id);
  };

  return (
    <div>
      {meetingId ? (
        <p>Share this Meeting ID: {meetingId}</p>
      ) : (
        <button onClick={handleCreateMeeting}>Create Meeting</button>
      )}
    </div>
  );
};


const JoinMeeting: React.FC = () => {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();

  if (!meetingId) {
    navigate("/"); // Redirect to home or another page if `meetingId` is undefined
    return null;
  }

  return (
    <MeetingProvider
      config={{
        meetingId: meetingId,
        micEnabled: true,
        webcamEnabled: true,
        name: Cookies.get("name")?.toString() ?? "Guest",
        debugMode: true,
      }}
      token={authToken}
    >
      <MeetingView
        meetingId={meetingId}
        onMeetingLeave={() => (window.location.href = "/")}
      />
    </MeetingProvider>
  );
};

export default Testing;

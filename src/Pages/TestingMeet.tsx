import React, { useEffect, useState } from "react"; // Added useState
import { useParams, useNavigate, useSearchParams } from "react-router-dom"; // Added useSearchParams
import { MeetingProvider } from "@videosdk.live/react-sdk";
import MeetingView from "./MeetingView";
import { authToken, createMeeting } from "./Sub-parts/MeetComponents";
import Cookies from "js-cookie";

const Testing: React.FC = () => {
  return (
    <>
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
  const { meetid } = useParams<{ meetid: string }>();
  console.log("JoinMeeting: meetid:", meetid);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // Hook to get query parameters

  const sessionId = searchParams.get("sessionId");
  const partnerName = searchParams.get("partnerName");
  const partnerAvatar = searchParams.get("partnerAvatar");
  const interestId = searchParams.get("interestId");
  const partnerId = searchParams.get("partnerId"); // Assuming partnerId is also passed if needed for StartCall

  if (!meetid || !sessionId || !interestId || !partnerName || !partnerAvatar || !partnerId) {
    // Redirect if essential parameters are missing
    console.error("Missing essential URL parameters for JoinMeeting:", { meetid, sessionId, interestId, partnerName, partnerAvatar, partnerId });
    navigate("/");
    return null;
  }

  return (
    <MeetingProvider
      config={{
        meetingId: meetid,
        micEnabled: true,
        webcamEnabled: true,
        name: Cookies.get("name")?.toString() ?? "Guest",
        debugMode: true,
      }}
      token={authToken}
    >
      <MeetingView
        meetingId={meetid}
        sessionId={sessionId} // Pass sessionId
        interestId={interestId} // Pass interestId
        partnerName={partnerName} // Pass partnerName
        partnerAvatar={partnerAvatar} // Pass partnerAvatar
        partnerId={partnerId} // Pass partnerId
        onMeetingLeave={() => (window.location.href = "/test/"+interestId)} // Keep existing leave behavior
      />
    </MeetingProvider>
  );
};

export default Testing;
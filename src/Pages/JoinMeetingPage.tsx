import React, { useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { MeetingProvider } from "@videosdk.live/react-sdk";
import MeetingView from "./Sub-parts/MeetingView"; // Corrected import path
import { authToken } from "./Sub-parts/MeetComponents"; // Corrected import path
import Cookies from "js-cookie";
import { toast } from "sonner"; // Ensure sonner is installed for toasts

const JoinMeeting: React.FC = () => {
  const { meetid } = useParams<{ meetid: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const sessionId = searchParams.get("sessionId");
  const partnerName = searchParams.get("partnerName");
  const partnerAvatar = searchParams.get("partnerAvatar");
  const interestId = searchParams.get("interestId");
  const partnerId = searchParams.get("partnerId");

  // Validate essential parameters
  useEffect(() => {
    if (!meetid || !sessionId || !interestId || !partnerName || !partnerAvatar || !partnerId) {
      console.error("Missing essential URL parameters for JoinMeeting:", { meetid, sessionId, interestId, partnerName, partnerAvatar, partnerId });
      toast.error("Missing essential call details. Redirecting to dashboard.");
      navigate("/dashboard"); // Redirect to a safe page like dashboard or home
    }
  }, [meetid, sessionId, interestId, partnerName, partnerAvatar, partnerId, navigate]);

  // If parameters are missing, return null early to prevent rendering issues
  if (!meetid || !sessionId || !interestId || !partnerName || !partnerAvatar || !partnerId) {
    return null;
  }

  return (
    <MeetingProvider
      config={{
        meetingId: meetid,
        micEnabled: true, // Start with mic enabled
        webcamEnabled: true, // Start with webcam enabled
        name: Cookies.get("name")?.toString() ?? "Guest", // Use user's name from cookies
        debugMode: true, // Enable debug mode for VideoSDK
      }}
      token={authToken} // Your VideoSDK auth token
    >
      <MeetingView
        meetingId={meetid}
        sessionId={sessionId}
        interestId={interestId}
        partnerName={partnerName}
        partnerAvatar={partnerAvatar}
        partnerId={partnerId}
        onMeetingLeave={() => {
          // This function is called when the user leaves the meeting
          // It redirects back to the chatroom for the specific interest
          window.location.href = "/test/" + interestId; // Full page reload for clean state
        }}
      />
    </MeetingProvider>
  );
};

export default JoinMeeting;

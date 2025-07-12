// import React, { useState, useEffect, useCallback, useRef } from "react";
// import { useMeeting } from "@videosdk.live/react-sdk";
// import ParticipantView from "./Sub-parts/ParticipantView";
// import axios from "axios";
// import Cookies from "js-cookie";
// import { toast } from "sonner";
// import { Client } from "@stomp/stompjs";
// import SockJS from "sockjs-client";
// import { useNavigate } from "react-router-dom";

// interface MeetingViewProps {
//     meetingId: string;
//     sessionId: string; // Meeting session ID from backend
//     interestId: string; // Interest ID for redirection
//     partnerName: string; // Partner's name
//     partnerAvatar: string; // Partner's avatar
//     partnerId: string; // Partner's user ID for StartCall
//     onMeetingLeave: () => void;
// }

// // Define the structure of the WebSocket payload for call termination
// interface CallEndNotificationPayload {
//     sessionId: string;
//     endedByUserId: string;
// }

// const MeetingView: React.FC<MeetingViewProps> = ({ meetingId, sessionId, interestId, partnerName, partnerAvatar, partnerId, onMeetingLeave }) => {
//     const navigate = useNavigate();
//     const [joined, setJoined] = useState<string | null>(null);
//     const stompClientRef = useRef<Client | null>(null);

//     const { join, leave, participants } = useMeeting({
//         onMeetingJoined: () => {
//             setJoined("JOINED");
//             handleStartCall();
//         },
//         onMeetingLeft: () => {
//             onMeetingLeave();
//         },
//     });

//     const currentUserId = Cookies.get("userId");
//     const jwtToken = Cookies.get("jwtToken");

//     const joinMeeting = () => {
//         setJoined("JOINING");
//         join();
//     };

//     const handleStartCall = useCallback(async () => {
//         if (!currentUserId || !partnerId || !sessionId || !meetingId || !jwtToken) {
//             toast.error("Missing user data or meeting info to start call.");
//             return;
//         }

//         try {
//             const response = await axios.post(
//                 "https://api.convofy.fun/api/call/StartCall",
//                 {
//                     sessionid: sessionId,
//                     userid1: currentUserId,
//                     userid2: partnerId,
//                     meetid: meetingId,
//                 },
//                 {
//                     headers: {
//                         "Content-Type": "application/json",
//                         Authorization: `Bearer ${jwtToken}`,
//                     },
//                 }
//             );

//             if (response.data.success) {
//                 toast.success(response.data.message);
//                 console.log("Backend notified: Call started successfully.");
//             } else {
//                 if (response.data.message === "Call has already begun.") {
//                     toast.info("Call has already started by the other participant.");
//                 } else {
//                     toast.error(response.data.message || "Failed to notify backend about call start.");
//                 }
//                 console.warn("Backend StartCall response:", response.data.message);
//             }
//         } catch (error: any) {
//             console.error("Error notifying backend about call start:", error);
//             toast.error(error.response?.data?.message || "An error occurred while starting the call on backend.");
//         }
//     }, [currentUserId, partnerId, sessionId, meetingId, jwtToken]);

//     const handleEndCall = useCallback(async () => {
//         if (!currentUserId || !sessionId || !jwtToken) {
//             toast.error("Missing user data or session ID to end call.");
//             return;
//         }

//         try {
//             toast.info("Ending call...");
//             const response = await axios.post(
//                 "https://api.convofy.fun/api/call/endCall",
//                 {
//                     sessionId: sessionId,
//                     userId: currentUserId,
//                 },
//                 {
//                     headers: {
//                         "Content-Type": "application/json",
//                         Authorization: `Bearer ${jwtToken}`,
//                     },
//                 }
//             );

//             if (response.data.success) {
//                 toast.success(response.data.message);
//                 console.log("Backend notified: Call ended successfully.");
//             } else {
//                 toast.error(response.data.message || "Failed to notify backend about call end.");
//             }
//         } catch (error: any) {
//             console.error("Error notifying backend about call end:", error);
//             toast.error(error.response?.data?.message || "An error occurred while ending the call on backend.");
//         } finally {
//             leave();
//         }
//     }, [currentUserId, sessionId, jwtToken, leave]);

//     useEffect(() => {
//         console.log("MeetingView WS Effect running with:", {
//             currentUserId,
//             sessionId,
//             interestId,
//             jwtToken,
//         });

//         if (!currentUserId || !jwtToken || !sessionId || !interestId) {
//             console.warn("Cannot establish WebSocket for call-end: Missing essential data.");
//             return;
//         }

//         if (stompClientRef.current && stompClientRef.current.active) {
//             console.log("Deactivating existing STOMP client.");
//             stompClientRef.current.deactivate();
//         }

//         const client = new Client({
//             webSocketFactory: () => new SockJS("https://api.convofy.fun/ws"),
//             debug: (str) => console.log(`STOMP DEBUG: ${str}`),
//             onConnect: () => {
//                 console.log("Connected to WebSocket server for call-end notifications.");
//                 // --- CHANGE HERE: Subscribe to the general /call topic ---
//                 const subscriptionPath = `/call`; // Changed to /call
//                 console.log(`Attempting to subscribe to: ${subscriptionPath}`);

//                 client.subscribe(subscriptionPath, (message) => {
//                     try {
//                         const data: CallEndNotificationPayload = JSON.parse(message.body);
//                         console.log("Received call-end WebSocket message body:", message.body);
//                         console.log("Parsed call-end WebSocket data:", data);

//                         console.log(`Comparing received sessionId (${data.sessionId}) with current sessionId prop (${sessionId})`);

//                         if (data.sessionId === sessionId) {
//                             toast.info(`Call ended by ${data.endedByUserId === currentUserId ? 'you' : 'the other user'}. Redirecting...`);
//                             console.log(`Navigating to /test/${interestId}`);
//                             navigate(`/test/${interestId}`);
//                         } else {
//                             console.warn(`Received call-end notification for different session. Expected: ${sessionId}, Received: ${data.sessionId}`);
//                         }
//                     } catch (error) {
//                         console.error("Error parsing call-end WebSocket message:", error);
//                         toast.error("Failed to process call termination signal.");
//                     }
//                 }, { Authorization: `Bearer ${jwtToken}` });
//             },
//             onStompError: (frame) => {
//                 console.error('Broker reported error for call-end WS: ' + frame.headers['message']);
//                 console.error('Additional details: ' + frame.body);
//                 toast.error('Call-end WebSocket error: ' + frame.headers['message']);
//             },
//             onDisconnect: () => {
//                 console.log("Disconnected from WebSocket server for call-end notifications.");
//             }
//         });

//         stompClientRef.current = client;
//         client.activate();

//         return () => {
//             if (stompClientRef.current && stompClientRef.current.active) {
//                 console.log("Deactivating STOMP client for call-end on component unmount.");
//                 stompClientRef.current.deactivate();
//             }
//         };
//     }, [currentUserId, sessionId, interestId, jwtToken, navigate]);

//     return (
//         <div>
//             <h3>Meeting ID: {meetingId}</h3>
//             {joined === "JOINED" ? (
//                 <>
//                     <div>
//                         {[...participants.keys()].map((participantId) => (
//                             <ParticipantView key={participantId} participantId={participantId} />
//                         ))}
//                     </div>
//                     <button onClick={handleEndCall}>Leave Meeting</button>
//                 </>
//             ) : joined === "JOINING" ? (
//                 <p>Joining meeting...</p>
//             ) : (
//                 <button onClick={joinMeeting}>Join Meeting</button>
//             )}
//         </div>
//     );
// };

// export default MeetingView;
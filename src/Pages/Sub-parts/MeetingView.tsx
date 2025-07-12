import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useMeeting } from "@videosdk.live/react-sdk";
import ParticipantView from "./ParticipantView";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useNavigate } from "react-router-dom";

interface MeetingViewProps {
    meetingId: string;
    sessionId: string; // Meeting session ID from backend
    interestId: string; // Interest ID for redirection
    partnerName: string; // Partner's name
    partnerAvatar: string; // Partner's avatar
    partnerId: string; // Partner's user ID for StartCall
    onMeetingLeave: () => void;
}

// Define the structure of the WebSocket payload for call termination
interface CallEndNotificationPayload {
    sessionId: string;
    endedByUserId: string;
}

const MeetingView: React.FC<MeetingViewProps> = ({ meetingId, sessionId, interestId, partnerName, partnerAvatar, partnerId, onMeetingLeave }) => {
    const navigate = useNavigate();
    const [joined, setJoined] = useState<string | null>(null); // "JOINING", "JOINED", "ERROR"
    const stompClientRef = useRef<Client | null>(null);

    const currentUserId = Cookies.get("userId");
    const jwtToken = Cookies.get("jwtToken");

    // useMeeting hook from VideoSDK.live
    const { join, leave, toggleMic, toggleWebcam, participants, localParticipant } = useMeeting({
        onMeetingJoined: () => {
            setJoined("JOINED");
            handleStartCall(); // Notify backend when meeting is successfully joined
        },
        onMeetingLeft: () => {
            onMeetingLeave(); // Trigger the prop function to navigate away
        },
        onError: (error) => {
            console.error("VideoSDK Meeting Error:", error);
            toast.error(`Video call error: ${error.message || "Unknown error"}`);
            setJoined("ERROR");
        }
    });

    const joinMeeting = () => {
        setJoined("JOINING");
        join(); // Call VideoSDK's join method
    };

    const handleStartCall = useCallback(async () => {
        if (!currentUserId || !partnerId || !sessionId || !meetingId || !jwtToken) {
            toast.error("Missing user data or meeting info to start call.");
            return;
        }

        try {
            const response = await axios.post(
                "https://api.convofy.fun/api/call/StartCall",
                {
                    sessionid: sessionId,
                    userid1: currentUserId,
                    userid2: partnerId,
                    meetid: meetingId,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${jwtToken}`,
                    },
                }
            );

            if (response.data.success) {
                toast.success(response.data.message);
                console.log("Backend notified: Call started successfully.");
            } else {
                if (response.data.message === "Call has already begun.") {
                    toast.info("Call has already started by the other participant.");
                } else {
                    toast.error(response.data.message || "Failed to notify backend about call start.");
                }
                console.warn("Backend StartCall response:", response.data.message);
            }
        } catch (error: any) {
            console.error("Error notifying backend about call start:", error);
            toast.error(error.response?.data?.message || "An error occurred while starting the call on backend.");
        }
    }, [currentUserId, partnerId, sessionId, meetingId, jwtToken]);

    const handleEndCall = useCallback(async () => {
        if (!currentUserId || !sessionId || !jwtToken) {
            toast.error("Missing user data or session ID to end call.");
            return;
        }

        try {
            toast.info("Ending call...");
            const response = await axios.post(
                "https://api.convofy.fun/api/call/endCall",
                {
                    sessionId: sessionId,
                    userId: currentUserId,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${jwtToken}`,
                    },
                }
            );

            if (response.data.success) {
                toast.success(response.data.message);
                console.log("Backend notified: Call ended successfully.");
            } else {
                toast.error(response.data.message || "Failed to notify backend about call end.");
            }
        } catch (error: any) {
            console.error("Error notifying backend about call end:", error);
            toast.error(error.response?.data?.message || "An error occurred while ending the call on backend.");
        } finally {
            leave();
        }
    }, [currentUserId, sessionId, jwtToken, leave]);

    // WebSocket for call termination notifications
    useEffect(() => {
        // Only attempt to connect if essential data is available
        if (!currentUserId || !jwtToken || !sessionId || !interestId) {
            console.warn("WebSocket for call-end cannot be established: Missing essential data (userId, token, sessionId, interestId).");
            // Do NOT return here immediately. Let the component render the "Ready to join?" state.
            // If these values are expected to always be present when this component mounts,
            // then the issue might be elsewhere (e.g., cookie access timing).
            return; // We will still return if essential data is missing to prevent connection attempts with invalid data.
        }

        // Deactivate any existing STOMP client to prevent multiple connections
        if (stompClientRef.current && stompClientRef.current.active) {
            console.log("Deactivating existing STOMP client for call-end notifications.");
            stompClientRef.current.deactivate();
        }

        const client = new Client({
            webSocketFactory: () => new SockJS("https://api.convofy.fun/ws"),
            debug: (str) => console.log(`STOMP DEBUG: ${str}`),
            onConnect: () => {
                console.log("Connected to WebSocket server for call-end notifications.");
                const subscriptionPath = `/call`;
                console.log(`Attempting to subscribe to: ${subscriptionPath}`);

                client.subscribe(subscriptionPath, (message) => {
                    try {
                        const data: CallEndNotificationPayload = JSON.parse(message.body);
                        console.log("Received call-end WebSocket message body:", message.body);
                        console.log("Parsed call-end WebSocket data:", data);

                        if (data.sessionId === sessionId) {
                            toast.info(`Call ended by ${data.endedByUserId === currentUserId ? 'you' : 'the other user'}. Redirecting...`);
                            console.log(`Navigating to /test/${interestId}`);
                            navigate(`/test/${interestId}`);
                        } else {
                            console.warn(`Received call-end notification for different session. Expected: ${sessionId}, Received: ${data.sessionId}`);
                        }
                    } catch (error) {
                        console.error("Error parsing call-end WebSocket message:", error);
                        toast.error("Failed to process call termination signal.");
                    }
                }, { Authorization: `Bearer ${jwtToken}` });
            },
            onStompError: (frame) => {
                console.error('Broker reported error for call-end WS: ' + frame.headers['message']);
                console.error('Additional details: ' + frame.body);
                toast.error('Call-end WebSocket error: ' + frame.headers['message']);
            },
            onDisconnect: () => {
                console.log("Disconnected from WebSocket server for call-end notifications.");
            }
        });

        stompClientRef.current = client;
        client.activate();

        // Cleanup function for useEffect
        return () => {
            if (stompClientRef.current && stompClientRef.current.active) {
                console.log("Deactivating STOMP client for call-end on component unmount.");
                stompClientRef.current.deactivate();
            }
        };
    }, [currentUserId, sessionId, interestId, jwtToken, navigate]); // Dependencies

    const isMicOn = useMemo(() => localParticipant?.micOn, [localParticipant]);
    const isWebcamOn = useMemo(() => localParticipant?.webcamOn, [localParticipant]);

    const sortedParticipantIds = useMemo(() => {
        const ids = Array.from(participants.keys());
        const localId = localParticipant?.id;
        if (localId && ids.includes(localId)) {
            return [localId, ...ids.filter(id => id !== localId)];
        }
        return ids;
    }, [participants, localParticipant]);


    if (joined === "JOINING") {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
                <p className="mt-4 text-xl">Joining meeting...</p>
                <p className="text-sm text-gray-400">Please ensure camera and microphone permissions are granted.</p>
            </div>
        );
    }

    if (joined === "ERROR") {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-red-900 text-white p-4">
                <h2 className="text-2xl font-bold mb-4">Connection Error</h2>
                <p className="text-lg text-center">There was an issue connecting to the video call. Please check your internet connection and permissions.</p>
                <button
                    onClick={() => navigate(`/test/${interestId}`)}
                    className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors"
                >
                    Return to Chatroom
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-white">
            <header className="flex items-center justify-between p-4 bg-gray-800 shadow-md">
                <h2 className="text-xl font-semibold text-primary-foreground">
                    Meeting with {partnerName}
                </h2>
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-400">Meeting ID:</span>
                    <span className="font-mono text-sm bg-gray-700 px-2 py-1 rounded-md">{meetingId}</span>
                </div>
            </header>

            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 p-4 overflow-auto">
                {joined === "JOINED" ? (
                    <>
                        {sortedParticipantIds.map((participantId) => (
                            <ParticipantView
                                key={participantId}
                                participantId={participantId}
                                partnerAvatar={participantId !== localParticipant?.id ? partnerAvatar : undefined}
                                isLocalUser={participantId === localParticipant?.id}
                            />
                        ))}
                    </>
                ) : (
                    <div className="col-span-full flex flex-col items-center justify-center bg-gray-800 rounded-lg p-8">
                        <p className="text-2xl font-bold mb-4">Ready to join?</p>
                        <button
                            onClick={joinMeeting}
                            className="px-8 py-4 bg-green-600 text-white rounded-full text-lg font-bold shadow-lg
                                       hover:bg-green-700 transition-colors transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-500 focus:ring-opacity-50"
                        >
                            Join Call Now
                        </button>
                        <p className="mt-4 text-sm text-gray-400">Ensure your camera and microphone are ready.</p>
                    </div>
                )}
            </div>

            {joined === "JOINED" && (
                <div className="flex justify-center items-center p-4 bg-gray-800 shadow-lg space-x-4">
                    <button
                        onClick={() => toggleMic()}
                        className={`p-3 rounded-full ${isMicOn ? 'bg-blue-600' : 'bg-gray-600'} text-white shadow-md
                                   hover:scale-105 transition-transform duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50`}
                        aria-label={isMicOn ? "Mute microphone" : "Unmute microphone"}
                    >
                        {isMicOn ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                                <path d="M19 10v2a7 7 0 01-14 0v-2h-2v2a9 9 0 008 8.94V23h2v-2.06A9 9 0 0021 12v-2h-2z" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2H5v2a9 9 0 008 8.94V23h2v-2.06A9 9 0 0021 12v-2h-2zm-6 0v2.78l-2-2V4a3 3 0 013-3v7z" clipRule="evenodd" />
                                <path fillRule="evenodd" d="M16.99 10.01a.75.75 0 00-1.06-1.06l-4.72 4.72-4.72-4.72a.75.75 0 10-1.06 1.06l5.25 5.25a.75.75 0 001.06 0l5.25-5.25z" clipRule="evenodd" />
                            </svg>
                        )}
                    </button>

                    <button
                        onClick={() => toggleWebcam()}
                        className={`p-3 rounded-full ${isWebcamOn ? 'bg-blue-600' : 'bg-gray-600'} text-white shadow-md
                                   hover:scale-105 transition-transform duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50`}
                        aria-label={isWebcamOn ? "Turn off webcam" : "Turn on webcam"}
                    >
                        {isWebcamOn ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM4 6v12h16V6H4z" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18 10.48V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4.48L22 18V6l-4 4.48zM4 6h12v12H4V6z" />
                                <path d="M12 17.5c-2.48 0-4.5-2.02-4.5-4.5s2.02-4.5 4.5-4.5 4.5 2.02 4.5 4.5-2.02 4.5-4.5 4.5zm0-7c-1.38 0-2.5 1.12-2.5 2.5s1.12 2.5 2.5 2.5 2.5-1.12 2.5-2.5-1.12-2.5-2.5-2.5z" />
                                <path d="M0 0h24v24H0z" fill="none" />
                            </svg>
                        )}
                    </button>

                    <button
                        onClick={handleEndCall}
                        className="px-6 py-3 bg-red-600 text-white rounded-full text-lg font-bold shadow-lg
                                   hover:bg-red-700 transition-colors transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-red-500 focus:ring-opacity-50"
                    >
                        End Call
                    </button>
                </div>
            )}
        </div>
    );
};

export default MeetingView;

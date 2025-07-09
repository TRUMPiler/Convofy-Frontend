import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMeeting } from "@videosdk.live/react-sdk";
import { toast } from 'sonner';
import Cookies from 'js-cookie';
import axios from 'axios';
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import ParticipantView from './ParticipantView';
import Controls from './Controls';

interface MeetingViewProps {
    meetingId: string;
    onMeetingLeave: () => void;
    partnerName: string;
    partnerAvatar: string;
    interestId: string;
}

const MeetingView: React.FC<MeetingViewProps> = ({ meetingId, onMeetingLeave, partnerName, partnerAvatar, interestId }) => {
    const [joined, setJoined] = useState<string | null>(null);
    const navigate = useNavigate();
    const stompClientRef = useRef<Client | null>(null);

    const getJwtToken = () => Cookies.get('jwtToken') || '';
    const currentUserId = Cookies.get('userId');

    const { join, leave, participants, localParticipant, enableWebcam, disableWebcam } = useMeeting({
        onMeetingJoined: () => setJoined("JOINED"),
        onMeetingLeft: () => {
            console.log("Meeting left callback from VideoSDK.");
            // Ensure media tracks are stopped when the meeting explicitly leaves
            if (localParticipant) {
                if (localParticipant.micOn) 
                if (localParticipant.webcamOn) disableWebcam();
            }
            // Additional manual track stopping if needed (less common with VideoSDK)
            navigator.mediaDevices.getUserMedia({ audio: true, video: true })
                .then(stream => {
                    stream.getTracks().forEach(track => track.stop());
                    console.log("Manually stopped media tracks on meeting left.");
                })
                .catch(e => console.error("Error stopping media tracks:", e));
            onMeetingLeave(); // Call this here to ensure navigation
        },
    });

    const handleLeaveMeeting = useCallback(async () => {
        try {
            const jwtToken = getJwtToken();
            console.log("Attempting to end meeting. currentUserId from cookie:", currentUserId); // Debug log
            await axios.post(
                'https://api.convofy.fun/api/meetings/end',
                { meetId: meetingId, disconnectedUserId: currentUserId },
                {
                    headers: {
                        Authorization: `Bearer ${jwtToken}`,
                    },
                }
            );
            toast.success("Call ended and your status is updated.");
        } catch (error) {
            console.error("Error ending meeting session on backend:", error);
            toast.error("Failed to end meeting session on backend. Please try again.");
        } finally {
            leave(); // This should trigger onMeetingLeft
            // onMeetingLeave(); // Removed from here as it's now called in onMeetingLeft
        }
    }, [meetingId, leave, currentUserId]); // Removed onMeetingLeave from deps as it's now internal to onMeetingLeft

    const joinMeeting = () => {
        setJoined("JOINING");
        join();
    };

    const remoteParticipants = useMemo(() => {
        return [...participants.keys()].filter(
            (participantId) => participantId !== localParticipant?.id
        );
    }, [participants, localParticipant]);

    useEffect(() => {
        if (!currentUserId) return;

        const jwtToken = getJwtToken();
        if (!jwtToken) {
            toast.error('Authentication required for meeting events.');
            navigate('/login');
            return;
        }

        if (stompClientRef.current && stompClientRef.current.active) {
            stompClientRef.current.deactivate();
        }

        const client = new Client({
            webSocketFactory: () => new SockJS("https://api.convofy.fun/ws"),
            debug: (str) => console.log(str),
            onConnect: () => {
                console.log("Connected to WebSocket server for MeetingView events!");

                const headers = {
                    'Authorization': `Bearer ${jwtToken}`,
                    'meetId': meetingId,
                };

                client.subscribe(`/user/${currentUserId}/queue/meeting-events`, (message) => {
                    try {
                        const data: { type: string; meetId: string; disconnectedUserId: string; message: string; timestamp: number } = JSON.parse(message.body);
                        console.log("Received WebSocket meeting event:", data);

                        if (data.type === "PARTNER_DISCONNECTED" && data.meetId === meetingId) {
                            toast.info(data.message || `Your partner has disconnected.`, { duration: 5000 });
                            setTimeout(() => {
                                // Trigger leave via VideoSDK, which will then call onMeetingLeft
                                leave();
                                // handleLeaveMeeting(); // Avoid calling handleLeaveMeeting again to prevent redundant API calls
                            }, 2000);
                        }
                    } catch (error) {
                        console.error("Error parsing WebSocket meeting event:", error);
                        toast.error("Failed to process meeting event from server.");
                    }
                }, headers);
            },
            onStompError: (frame) => {
                console.error('Broker reported error for MeetingView WS: ' + frame.headers['message']);
                console.error('Additional details: ' + frame.body);
                toast.error('WebSocket error in call: ' + frame.headers['message']);
            },
            onDisconnect: () => {
                console.log("Disconnected from WebSocket server (MeetingView).");
            }
        });

        stompClientRef.current = client;
        client.activate();

        return () => {
            if (stompClientRef.current && stompClientRef.current.active) {
                console.log("Deactivating STOMP client for MeetingView on unmount.");
                stompClientRef.current.deactivate();
            }
            // Also ensure media tracks are stopped on unmount
            navigator.mediaDevices.getUserMedia({ audio: true, video: true })
                .then(stream => {
                    stream.getTracks().forEach(track => track.stop());
                    console.log("Manually stopped media tracks on component unmount.");
                })
                .catch(e => console.error("Error stopping media tracks on unmount:", e));
        };
    }, [currentUserId, meetingId, navigate, leave]); // Added 'leave' to dependencies

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-white relative">
            <h1 className="text-2xl font-bold p-4 text-center">
                Your Call with {decodeURIComponent(partnerName || "Unknown")}
            </h1>
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 p-4 place-items-center">
                <h3>Meeting ID: {meetingId}</h3>
                {joined === "JOINED" ? (
                    <>
                        {localParticipant && (
                             <ParticipantView participantId={localParticipant.id} />
                        )}

                        {remoteParticipants.length > 0 ? (
                            remoteParticipants.map((participantId) => (
                                <ParticipantView key={participantId} participantId={participantId} />
                            ))
                        ) : (
                            <div className="text-xl text-gray-400 flex flex-col items-center justify-center p-4">
                                <img
                                    src={decodeURIComponent(partnerAvatar || 'https://placehold.co/100x100/374151/FFFFFF?text=Partner')}
                                    alt="Partner Avatar"
                                    className="w-28 h-28 rounded-full mb-4 border-2 border-blue-400"
                                    onError={(e) => { e.currentTarget.src = 'https://placehold.co/100x100/374151/FFFFFF?text=No+Cam'; }}
                                />
                                Waiting for {decodeURIComponent(partnerName || "your partner")} to join...
                                <p className="text-sm text-gray-500 mt-2">They might be connecting or disconnected.</p>
                            </div>
                        )}
                         <Controls onLeaveMeeting={handleLeaveMeeting} interestId={interestId} />
                    </>
                ) : joined === "JOINING" ? (
                    <p className="text-xl text-gray-400">Joining meeting...</p>
                ) : (
                    <button
                        onClick={joinMeeting}
                        className="bg-blue-600 text-white py-3 px-8 rounded-lg font-bold text-lg
                                   hover:bg-blue-700 transition-colors duration-300 shadow-md transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
                    >
                        Join Meeting
                    </button>
                )}
            </div>
        </div>
    );
};

export default MeetingView;
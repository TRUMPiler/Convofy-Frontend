import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useMeeting } from "@videosdk.live/react-sdk";
import ParticipantView from "./ParticipantView";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useNavigate } from "react-router-dom";

interface CallChatMessage {
    id: string;
    senderId: string;
    senderName: string;
    senderAvatar: string;
    content: string;
    timestamp: string;
}

interface MeetingViewProps {
    meetingId: string;
    sessionId: string;
    interestId: string;
    partnerName: string;
    partnerAvatar: string;
    partnerId: string;
    onMeetingLeave: () => void;
}

interface CallEndNotificationPayload {
    sessionId: string;
    endedByUserId: string;
}

const MeetingView: React.FC<MeetingViewProps> = ({ meetingId, sessionId, interestId, partnerName, partnerAvatar, partnerId, onMeetingLeave }) => {
    const navigate = useNavigate();
    const [joined, setJoined] = useState<string | null>(null);
    const stompClientRef = useRef<Client | null>(null);

    const [callMessages, setCallMessages] = useState<CallChatMessage[]>([]);
    const [newChatMessage, setNewChatMessage] = useState<string>('');
    const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
    const chatMessagesEndRef = useRef<HTMLDivElement>(null);

    const currentUserId = Cookies.get("userId");
    const currentUserName = Cookies.get("name")?.toString() ?? "Guest";
    const currentUserAvatar = Cookies.get("avatar")?.toString() ?? "https://placehold.co/40x40/cccccc/333333?text=You";
    const jwtToken = Cookies.get("jwtToken");

    const { join, leave, toggleMic, toggleWebcam, participants, localParticipant } = useMeeting({
        onMeetingJoined: () => {
            setJoined("JOINED");
            handleStartCall();
        },
        onMeetingLeft: () => {
            onMeetingLeave();
        },
        onError: (error) => {
            console.error("VideoSDK Meeting Error:", error);
            toast.error(`Video call error: ${error.message || "Unknown error"}`);
            setJoined("ERROR");
        }
    });

    const joinMeeting = () => {
        setJoined("JOINING");
        join();
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

    useEffect(() => {
        if (!currentUserId || !jwtToken || !sessionId || !interestId || !meetingId) {
            console.warn("WebSocket for call/chat cannot be established: Missing essential data.");
            return;
        }

        if (stompClientRef.current && stompClientRef.current.active) {
            console.log("Deactivating existing STOMP client for call/chat notifications.");
            stompClientRef.current.deactivate();
        }

        const client = new Client({
            webSocketFactory: () => new SockJS("https://api.convofy.fun/ws"),
            debug: (str) => console.log(`STOMP DEBUG: ${str}`),
            onConnect: () => {
                console.log("Connected to WebSocket server for call/chat notifications.");

                client.subscribe(`/call`, (message) => {
                    try {
                        const data: CallEndNotificationPayload = JSON.parse(message.body);
                        if (data.sessionId === sessionId) {
                            toast.info(`Call ended by ${data.endedByUserId === currentUserId ? 'you' : 'the other user'}. Redirecting...`);
                            navigate(`/test/${interestId}`);
                        }
                    } catch (error) {
                        console.error("Error parsing call-end WebSocket message:", error);
                        toast.error("Failed to process call termination signal.");
                    }
                }, { Authorization: `Bearer ${jwtToken}` });

                client.subscribe(`/topic/meeting-chat/${meetingId}`, (message) => {
                    try {
                        const receivedMessage: CallChatMessage = JSON.parse(message.body);
                        console.log("Received new chat message:", receivedMessage);
                        setCallMessages((prevMessages) => [...prevMessages, receivedMessage]);
                    } catch (error) {
                        console.error("Error parsing chat WebSocket message:", error);
                    }
                }, { Authorization: `Bearer ${jwtToken}` });
            },
            onStompError: (frame) => {
                console.error('Broker reported error for call/chat WS: ' + frame.headers['message']);
                console.error('Additional details: ' + frame.body);
                toast.error('WebSocket error: ' + frame.headers['message']);
            },
            onDisconnect: () => {
                console.log("Disconnected from WebSocket server for call/chat notifications.");
            }
        });

        stompClientRef.current = client;
        client.activate();

        return () => {
            if (stompClientRef.current && stompClientRef.current.active) {
                console.log("Deactivating STOMP client for call/chat on component unmount.");
                stompClientRef.current.deactivate();
            }
        };
    }, [currentUserId, sessionId, interestId, jwtToken, navigate, meetingId]);

    useEffect(() => {
        if (isChatOpen) {
            chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [callMessages, isChatOpen]);

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

    const handleSendChatMessage = useCallback(() => {
        if (!newChatMessage.trim() || !meetingId || !stompClientRef.current || !stompClientRef.current.active) {
            return;
        }

        const jwtToken = Cookies.get("jwtToken");
        if (!jwtToken) {
            toast.error('Authentication required to send chat messages.');
            return;
        }

        const messagePayload: CallChatMessage = {
            id: crypto.randomUUID(),
            senderId: currentUserId || "unknown",
            senderName: currentUserName,
            senderAvatar: currentUserAvatar,
            content: newChatMessage.trim(),
            timestamp: new Date().toISOString(),
        };

        // Publish the message using the STOMP client
        stompClientRef.current.publish({
            destination: `/app/meeting.sendMessage/${meetingId}`,
            headers: { Authorization: `Bearer ${jwtToken}` },
            body: JSON.stringify(messagePayload)
        });

        // Removed optimistic update: Message will now only be added when received via WebSocket
        setNewChatMessage('');
    }, [newChatMessage, meetingId, currentUserId, currentUserName, currentUserAvatar]);

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
        <div className="flex flex-col h-screen bg-gray-900 text-white relative">
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

            {/* Chat Toggle Button - at the top-right corner with high z-index */}
            {joined === "JOINED" && (
                <button
                    onClick={() => setIsChatOpen(!isChatOpen)}
                    className="absolute top-4 right-4 z-50 p-3 rounded-full bg-blue-600 text-white shadow-md
                               hover:bg-blue-700 transition-colors transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50"
                    aria-label={isChatOpen ? "Close chat" : "Open chat"}
                >
                    {isChatOpen ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                            <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
                        </svg>
                    ) : (
                        // Standard chat icon
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                            <path fillRule="evenodd" d="M4.848 2.771A9.75 9.75 0 0112 2.25c5.392 0 9.75 4.358 9.75 9.75s-4.358 9.75-9.75 9.75c-1.38 0-2.7-.207-3.957-.596L2.62 21.454a.75.75 0 01-1.003-.966l1.248-3.743a9.75 9.75 0 01-1.058-4.715C1.5 6.913 5.858 2.25 11.25 2.25h.75c-.015 0-.029 0-.044 0H4.848z" clipRule="evenodd" />
                        </svg>
                    )}
                </button>
            )}

            {/* Chat Panel - now absolutely positioned relative to the main h-screen container */}
            {joined === "JOINED" && (
                <div className={`absolute right-4 bottom-4 w-80 h-[calc(100vh - 120px)] bg-gray-700 rounded-lg shadow-xl flex flex-col transition-transform duration-300 ease-in-out z-40 ${isChatOpen ? 'translate-x-0' : 'translate-x-[calc(100%+16px)]'}`}>
                    <div className="p-3 bg-gray-800 rounded-t-lg flex items-center justify-between">
                        <h4 className="text-lg font-semibold">In-Call Chat</h4>
                        <button onClick={() => setIsChatOpen(false)} className="text-gray-400 hover:text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                    <div className="flex-grow overflow-y-auto p-3 space-y-3 custom-scrollbar">
                        {callMessages.length === 0 ? (
                            <p className="text-center text-gray-400 text-sm mt-4">No messages yet. Say hello!</p>
                        ) : (
                            callMessages.map((msg) => {
                                const isOwnMessage = msg.senderId === currentUserId;
                                return (
                                    <div key={msg.id} className={`flex items-start ${isOwnMessage ? 'justify-end' : 'justify-start'} space-x-2`}>
                                        {!isOwnMessage && (
                                            <img
                                                src={msg.senderAvatar || 'https://placehold.co/40x40/cccccc/333333?text=U'}
                                                alt={msg.senderName}
                                                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                                referrerPolicy='no-referrer'
                                            />
                                        )}
                                        <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[70%]`}>
                                            <span className={`text-xs ${isOwnMessage ? 'text-gray-400' : 'text-gray-300'}`}>
                                                {isOwnMessage ? 'You' : msg.senderName}
                                            </span>
                                            <div className={`rounded-lg px-3 py-2 text-sm break-words ${isOwnMessage ? 'bg-blue-500 text-white' : 'bg-gray-600 text-white'}`}>
                                                {msg.content}
                                            </div>
                                            <span className="text-xs text-gray-400 mt-1">
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        {isOwnMessage && (
                                            <img
                                                src={currentUserAvatar || 'https://placehold.co/40x40/cccccc/333333?text=You'}
                                                alt="You"
                                                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                                referrerPolicy='no-referrer'
                                            />
                                        )}
                                    </div>
                                );
                            })
                        )}
                        <div ref={chatMessagesEndRef} />
                    </div>
                    <div className="p-3 bg-gray-800 rounded-b-lg">
                        <form onSubmit={(e) => { e.preventDefault(); handleSendChatMessage(); }} className="flex space-x-2">
                            <input
                                type="text"
                                value={newChatMessage}
                                onChange={(e) => setNewChatMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-grow p-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <button
                                type="submit"
                                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                                disabled={!newChatMessage.trim()}
                            >
                                {/* Send Button Image Icon */}
                                <img width="24" height="24" src="https://img.icons8.com/material-sharp/24/sent.png" alt="Send" />
                            </button>
                        </form>
                    </div>
                </div>
            )}

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

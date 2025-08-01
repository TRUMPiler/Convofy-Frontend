import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "sonner";
import Navbar from "./Sub-parts/NavigationBar";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

interface WaitingQueueInterestDTO {
    interestid: string;
    userid: string;
    statusid?: string;
}

interface MatchNotificationPayload {
    meetId: string;
    message: string;
    userId: string; // The recipient user's ID
    partnerId: string; // Partner's ID
    partnerName: string;
    partnerAvatar: string;
    sessionId: string;
}

// Assuming the backend's Response structure
interface ApiResponse<T> {
    success: boolean;
    message: string | null;
    data: T | null;
}

const WaitingRoom: React.FC = () => {
    const navigate = useNavigate();
    const { interestId } = useParams<{ interestId: string }>();
    const [status, setStatus] = useState<"waiting" | "ready" | "error" | "Nothing">("Nothing");
    const [meetId, setMeetId] = useState<string | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [interestName, setInterestName] = useState<string>("Loading interest...");
    const [partnerAvatar, setPartnerAvatar] = useState<string | null>(null);
    const [partnerName, setPartnerName] = useState<string | null>(null);
    const [partnerId, setPartnerId] = useState<string | null>(null);

    const initialCheckTriggered = useRef(false);
    const stompClientRef = useRef<Client | null>(null);
    const matchFoundByWSRef = useRef(false); // Flag to ensure WS match takes precedence

    // Effect for initial checks and navigation to login/dashboard if prerequisites are not met
    useEffect(() => {
        if (!Cookies.get("userId")) {
            toast.error("You need to be logged in to access the waiting room.");
            navigate("/login");
            return;
        }
        if (!interestId) {
            toast.error("Interest ID is missing from the URL. Please select an interest.");
            navigate("/dashboard");
        }
    }, [navigate, interestId]);

    // Effect to fetch interest name for display
    useEffect(() => {
        const fetchInterestName = async () => {
            if (!interestId) {
                setInterestName("Unknown Interest");
                return;
            }
            try {
                // IMPORTANT: Use the correct production API URL here if different from localhost
                const response = await axios.get(`https://api.convofy.fun/api/interests/${interestId}`);
                if (response.data.success && response.data.data && response.data.data.name) {
                    setInterestName(response.data.data.name);
                } else {
                    setInterestName("Interest Not Found");
                    toast.error(response.data.message || "Failed to fetch interest details.");
                }
            } catch (error) {
                console.error("Error fetching interest name:", error);
                setInterestName("Error loading interest");
                toast.error("Error loading interest name.");
            }
        };

        fetchInterestName();
    }, [interestId]);

    // Callback for handling WebSocket match notifications (for the waiting person)
    const handleMatchNotification = useCallback((data: MatchNotificationPayload) => {
        const currentUserId = Cookies.get("userId");
        if (data.userId === currentUserId) {
            if (data.meetId && data.sessionId && data.partnerId) {
                console.log("WebSocket: Match found! Setting status to ready and meetId:", data.meetId);
                matchFoundByWSRef.current = true; // Set flag immediately to prevent HTTP check interference
                setMeetId(data.meetId);
                setPartnerId(data.partnerId);
                setPartnerName(data.partnerName);
                setPartnerAvatar(data.partnerAvatar);
                setSessionId(data.sessionId);
                Cookies.set("sessionId", data.sessionId);
                setStatus("ready"); // Update UI state to "ready"
                toast.success(`Match found! Preparing your call with ${data.partnerName}...`);
            } else {
                console.warn("WebSocket: Received incomplete match data, ignoring:", data);
            }
        } else {
            console.log("WebSocket: Received message for another user, ignoring.");
        }
    }, []);

    // Effect for establishing WebSocket connection and subscription
    useEffect(() => {
        const userId = Cookies.get("userId");
        const jwtToken = Cookies.get("jwtToken");

        if (!userId || !jwtToken) {
            console.error("WebSocket setup failed: User ID or JWT token missing.");
            return;
        }

        if (stompClientRef.current && stompClientRef.current.active) {
            console.log("Deactivating existing STOMP client before new activation.");
            stompClientRef.current.deactivate();
        }

        const client = new Client({
            // IMPORTANT: Use the correct production WebSocket URL here if different from localhost
            webSocketFactory: () => new SockJS("https://api.convofy.fun/ws"),
            debug: (str) => console.log(`[STOMP Debug] ${str}`),
            onConnect: () => {
                console.log("Connected to WebSocket server.");
                client.subscribe(`/queue/matches`, (message) => {
                    try {
                        const data: MatchNotificationPayload = JSON.parse(message.body);
                        console.log("Received WebSocket message:", data);
                        handleMatchNotification(data);
                    } catch (error) {
                        console.error("Error parsing WebSocket message:", error);
                        toast.error("Failed to process match data from server.");
                        setStatus("error");
                    }
                }, { Authorization: `Bearer ${jwtToken}` });
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
                console.error('Additional details: ' + frame.body);
                toast.error('WebSocket error: ' + frame.headers['message']);
                setStatus("error");
            },
            onDisconnect: () => {
                console.log("Disconnected from WebSocket server.");
            }
        });

        stompClientRef.current = client;
        client.activate();

        return () => {
            if (stompClientRef.current && stompClientRef.current.active) {
                console.log("Deactivating STOMP client on component unmount.");
                stompClientRef.current.deactivate();
            }
        };
    }, [handleMatchNotification]);

    // Callback for checking queue status via HTTP (initial entry or retry)
    const checkQueueStatus = useCallback(async () => {
        if (matchFoundByWSRef.current || status === "ready") {
            console.log(`HTTP Check skipped: Match already found by WebSocket (${matchFoundByWSRef.current}) or status is already 'ready' (${status}).`);
            return;
        }

        if (status !== "waiting" && status !== "error") {
            setStatus("Nothing");
        }

        const userId = Cookies.get("userId");
        const jwtToken = Cookies.get("jwtToken");

        if (!userId || !interestId || !jwtToken) {
            toast.error("User ID, Interest ID, or JWT token missing for queue check.");
            setStatus("error");
            return;
        }

        try {
            console.log("Making HTTP POST request to check queue status for User:", userId, "Interest:", interestId);
            const requestBody: WaitingQueueInterestDTO = {
                userid: userId,
                interestid: interestId,
            };

            // First, check the queue status
            // IMPORTANT: Use the correct production API URL here
            const queueCheckResponse = await axios.post(
                "https://api.convofy.fun/api/queue/check",
                requestBody,
                { headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwtToken}` } }
            );

            if (queueCheckResponse.data.success && queueCheckResponse.data.data) {
                const matchedPartnerId = queueCheckResponse.data.data;
                console.log("HTTP Check: Immediate match found with partner ID:", matchedPartnerId);

                // If match found via HTTP, immediately attempt to create meeting.
                // This user (the creator) will receive the MatchNotificationPayload directly in the HTTP response.
                // The other user (the waiting one) will receive it via WebSocket.
                // IMPORTANT: Use the correct production API URL here
                const createMeetingResponse = await axios.post(
                    "https://api.convofy.fun/api/meetings/create",
                    { userid1: userId, userid2: matchedPartnerId, interestId: interestId },
                    { headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwtToken}` } }
                );

                if (createMeetingResponse.data.success && createMeetingResponse.data.data) {
                    const data = createMeetingResponse.data.data;
                    console.log("HTTP Create Meeting: Match found and details received:", data);
                    // Update state directly from the HTTP response for the creator
                    setMeetId(data.meetId);
                    setPartnerId(data.partnerId);
                    setPartnerName(data.partnerName);
                    setPartnerAvatar(data.partnerAvatar);
                    setSessionId(data.sessionId);
                    Cookies.set("sessionId", data.sessionId);
                    matchFoundByWSRef.current = true; // Set flag to prevent further HTTP checks
                    setStatus("ready"); // Transition to ready state
                    toast.success(`Match found! Preparing your call with ${data.partnerName}...`);
                } else {
                    toast.error(createMeetingResponse.data.message || "Failed to create meeting after match.");
                    setStatus("error");
                }

            } else {
                // User added to queue or already in queue, waiting for a partner via WebSocket
                console.log("HTTP Check: User added to queue or already in queue, waiting for a partner.");
                setStatus("waiting");
                toast.info(queueCheckResponse.data.message || "You've joined the queue. Waiting for a match...", { duration: 5000 });
            }
        } catch (error: any) {
            console.error("Error checking queue status or creating meeting via HTTP:", error);
            const errorMessage = error.response?.data?.message || "An error occurred while checking queue status.";
            toast.error(errorMessage);
            setStatus("error");
        }
    }, [interestId, status]);

    // Effect to trigger initial queue status check only once on component mount
    useEffect(() => {
        if (!initialCheckTriggered.current && interestId) {
            initialCheckTriggered.current = true;
            checkQueueStatus();
        }
    }, [checkQueueStatus, interestId]);

    // Effect to handle navigation once a match is ready and all data is set
    useEffect(() => {
        if (status === "ready" && meetId && sessionId && partnerName && partnerAvatar && interestId && partnerId) {
            const queryParams = new URLSearchParams({
                partnerName: partnerName,
                partnerAvatar: partnerAvatar,
                interestId: interestId,
                sessionId: sessionId,
                partnerId: partnerId,
            }).toString();
            console.log("Navigating to meeting:", `/join/${meetId}?${queryParams}`);
            navigate(`/join/${meetId}?${queryParams}`);
        }
    }, [status, meetId, sessionId, partnerName, partnerAvatar, interestId, partnerId, navigate]);


    const handleLeaveQueue = async () => {
        const userId = Cookies.get("userId");
        const jwtToken = Cookies.get("jwtToken");

        if (!userId || !jwtToken) {
            toast.error("User ID or JWT token missing. Cannot leave queue.");
            return;
        }

        try {
            toast.info("Leaving the queue...");
            // IMPORTANT: Use the correct production API URL here
            const response = await axios.get(
                `https://api.convofy.fun/api/queue/leave/${userId}`,
                { headers: { Authorization: `Bearer ${jwtToken}` } }
            );

            if (response.data.success) {
                toast.success(response.data.message || 'Successfully left the queue.');
                navigate(`/chatroom/${interestId}`);
            } else {
                toast.error(response.data.message || 'Failed to leave queue.');
            }
        } catch (error: any) {
            console.error('Error leaving queue:', error);
            toast.error(error.response?.data?.message || 'An error occurred while leaving the queue.');
        }
    };

    return (
        <>
            <Navbar />
            <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
                <h1 className="text-4xl font-bold mb-4 text-primary">
                    Connecting with someone having same interest [ {interestName} ]
                </h1>
                {status === "ready" && (
                    <div className="text-center p-6 bg-card rounded-xl shadow-lg border border-border max-w-md w-full mx-4">
                        <p className="text-2xl font-bold mb-4 text-primary">Meeting Ready!</p>
                        <p className="text-lg mb-4">You're matched with <span className="font-semibold text-accent-foreground">{partnerName}</span>.</p>
                        {partnerAvatar && (
                            <img
                                src={partnerAvatar}
                                alt={`${partnerName}'s avatar`}
                                className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                                onError={(e) => { e.currentTarget.src = `https://placehold.co/96x96/cccccc/333333?text=Avatar`; }} // Fallback image
                            />
                        )}
                        <p className="text-sm text-muted-foreground mb-6">Meeting ID: <span className="font-mono bg-secondary px-2 py-1 rounded-md">{meetId}</span></p>
                        {/* The button's onClick now directly triggers navigation, but the main navigation is handled by the useEffect */}
                        <button
                            className="bg-green-600 text-white py-3 px-8 rounded-lg font-bold text-lg
                                         hover:bg-green-700 transition-colors duration-300 shadow-md transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75"
                            onClick={() => navigate(`/join/${meetId}?partnerName=${encodeURIComponent(partnerName || '')}&partnerAvatar=${encodeURIComponent(partnerAvatar || '')}&interestId=${encodeURIComponent(interestId || '')}&sessionId=${encodeURIComponent(sessionId || '')}&partnerId=${encodeURIComponent(partnerId || '')}`)}>
                            Join Meeting
                        </button>
                    </div>
                )}
                {status === "waiting" && (
                    <div className="text-center p-6">
                        <p className="text-3xl text-primary font-extrabold animate-pulse">Waiting for another participant...</p>

                        <div className="mt-8 flex justify-center">
                            <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                        <button
                            onClick={handleLeaveQueue}
                            className="mt-8 bg-red-600 text-white py-3 px-8 rounded-lg font-bold text-lg
                                         hover:bg-red-700 transition-colors duration-300 shadow-md transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75"
                        >
                            Leave Queue
                        </button>
                    </div>
                )}
                {status === "error" && (
                    <div className="text-center p-6 bg-destructive/20 border border-destructive text-destructive-foreground rounded-xl shadow-lg max-w-md w-full mx-4">
                        <p className="text-2xl font-bold mb-4">Oops! Something went wrong.</p>
                        <p className="text-lg mb-6">An error occurred. Please try again.</p>
                        <button
                            className="bg-red-600 text-white py-3 px-8 rounded-lg font-bold text-lg
                                         hover:bg-red-700 transition-colors duration-300 shadow-md transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75"
                            onClick={checkQueueStatus}
                        >
                            Retry
                        </button>
                    </div>
                )}
                {status === "Nothing" && (
                    <div className="text-center p-6">
                        <p className="text-3xl text-primary font-extrabold">Loading...</p>
                        <p className="text-muted-foreground mt-4 text-lg">Checking your queue status. Please wait.</p>
                        <div className="mt-8 flex justify-center">
                            <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default WaitingRoom;

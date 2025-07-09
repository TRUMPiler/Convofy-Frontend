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
    userId: string;
    partnerId: string;
    partnerName: string;
    partnerAvatar: string;
    sessionId:string;
}

const WaitingRoom: React.FC = () => {
    const navigate = useNavigate();
    const { interestId } = useParams<{ interestId: string }>();
    const [status, setStatus] = useState<"waiting" | "ready" | "error" | "Nothing">("Nothing");
    const [otherUserEmail, setOtherUserEmail] = useState<string | null>(null);
    const [meetId, setMeetId] = useState<string | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [interestName, setInterestName] = useState<string>("Loading interest...");
    const [partnerAvatar, setPartnerAvatar] = useState<string | null>(null);
    const [partnerName, setPartnerName] = useState<string | null>(null);

    const initialCheckTriggered = useRef(false);
    const stompClientRef = useRef<Client | null>(null);
    const matchFoundByWSRef = useRef(false);

    useEffect(() => {
        if (!Cookies.get("userId")) {
            navigate("/login");
        }
        if (!interestId) {
            toast.error("Interest ID is missing from the URL.");
            navigate("/dashboard");
        }
    }, [navigate, interestId]);

    useEffect(() => {
        const fetchInterestName = async () => {
            if (!interestId) {
                setInterestName("Unknown Interest");
                return;
            }
            try {
                const response = await axios.get(`http://localhost:8080/api/interests/${interestId}`);
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

    useEffect(() => {
        const userId = Cookies.get("userId");
        if (!userId) {
            toast.error("User ID not found. Please log in.");
            navigate("/login");
            return;
        }

        if (stompClientRef.current && stompClientRef.current.active) {
            stompClientRef.current.deactivate();
        }

        const client = new Client({
            webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
            debug: (str) => console.log(str),
            onConnect: () => {
                console.log("Connected to WebSocket server");
                client.subscribe(`/queue/matches`, (message) => {
                    try {
                        const data: MatchNotificationPayload = JSON.parse(message.body);
                        console.log("Received WebSocket message:", data);
                        
                        if (data.userId === userId) {
                            if (data.meetId && data.sessionId && data.partnerId) {
                                console.log("WebSocket: Match found! Setting status to ready and meetId:", data.meetId);
                                matchFoundByWSRef.current = true;
                                setMeetId(data.meetId);
                                setOtherUserEmail(data.partnerId);
                                setPartnerName(data.partnerName); 
                                setPartnerAvatar(data.partnerAvatar); 
                                setSessionId(data.sessionId);
                                Cookies.set("sessionId", data.sessionId);
                                setStatus("ready");
                                toast.success(`Match found! Preparing your call...`);

                                navigate(
                                    `/join/${data.meetId}?partnerName=${encodeURIComponent(data.partnerName || '')}&partnerAvatar=${encodeURIComponent(data.partnerAvatar || '')}&interestId=${encodeURIComponent(interestId || '')}&sessionId=${encodeURIComponent(data.sessionId || '')}&partnerId=${encodeURIComponent(data.partnerId || '')}`
                                );

                            } else {
                                console.log("WebSocket: Received message without meetId, sessionId, or partnerId, ignoring:", data);
                            }
                        } else {
                            console.log("WebSocket: Received message for another user, ignoring.");
                        }
                    } catch (error) {
                        console.error("Error parsing WebSocket message:", error);
                        toast.error("Failed to process match data from server.");
                        setStatus("error");
                    }
                }, { Authorization: `Bearer ${Cookies.get("jwtToken")}` });
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
                console.error('Additional details: ' + frame.body);
                toast.error('WebSocket error: ' + frame.headers['message']);
                setStatus("error");
            },
            onDisconnect: () => {
                console.log("Disconnected from WebSocket server");
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
    }, [navigate, interestId]);

    const checkQueueStatus = useCallback(async () => {
        if (matchFoundByWSRef.current) {
            console.log("HTTP Check skipped: Match already found by WebSocket.");
            return;
        }

        if (status === "ready") {
            return;
        }
        if (status !== "waiting") {
            setStatus("Nothing");
        }

        const userId = Cookies.get("userId");
        const jwtToken = Cookies.get("jwtToken");

        if (!userId || !interestId || !jwtToken) {
            toast.error("User ID, Interest ID, or JWT token missing.");
            setStatus("error");
            return;
        }

        try {
            console.log("Making HTTP POST request to check queue status for User:", userId, "Interest:", interestId);
            const requestBody: WaitingQueueInterestDTO = {
                userid: userId,
                interestid: interestId,
            };

            const response = await axios.post(
                "http://localhost:8080/api/queue/check",
                requestBody,
                { headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwtToken}` } }
            );

            if (response.status === 200) {
                if (response.data.success && response.data.data) {
                    const matchedPartnerId = response.data.data;
                    console.log("HTTP Check: Immediate match found with partner ID:", matchedPartnerId);

                    await axios.post(
                        "http://localhost:8080/api/meetings/create",
                        { userid1: userId, userid2: matchedPartnerId, interestId: interestId },
                        { headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwtToken}` } }
                    );

                    setStatus("waiting");
                    toast.info("Match found! Waiting for meeting details...", { duration: 5000 });

                } else {
                    console.log("HTTP Check: User already in queue, waiting for a partner.");
                    setStatus("waiting");
                    toast.info("You are already in the queue. Waiting for a match...", { duration: 5000 });
                }
            } else if (response.status === 201) {
                console.log("HTTP Check: User added to queue, waiting for a partner.");
                setStatus("waiting");
                toast.info("You've joined the queue. Waiting for a match...", { duration: 5000 });
            } else if (response.status === 409) {
                toast.error(response.data.message || "You are currently in a call/busy.");
                setStatus("error");
            } else {
                toast.error(response.data.message || "Failed to check queue status.");
                setStatus("error");
            }
        } catch (error: any) {
            console.error("Error checking queue status via HTTP:", error);
            const errorMessage = error.response?.data?.message || "An error occurred while checking queue status.";
            toast.error(errorMessage);
            setStatus("error");
        }
    }, [interestId, status]);

    useEffect(() => {
        if (!initialCheckTriggered.current && interestId) {
            initialCheckTriggered.current = true;
            checkQueueStatus();
        }
    }, [checkQueueStatus, interestId]);

    const handleLeaveQueue = async () => {
        const userId = Cookies.get("userId");
        const jwtToken = Cookies.get("jwtToken");

        if (!userId || !jwtToken) {
            toast.error("User ID or JWT token missing. Cannot leave queue.");
            return;
        }

        try {
            toast.info("Leaving the queue...");
            const response = await axios.get(
                `http://localhost:8080/api/queue/leave/${userId}`,
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
                        <p className="text-sm text-muted-foreground mb-6">Meeting ID: <span className="font-mono bg-secondary px-2 py-1 rounded-md">{meetId}</span></p>
                        <button
                            className="bg-green-600 text-white py-3 px-8 rounded-lg font-bold text-lg
                                         hover:bg-green-700 transition-colors duration-300 shadow-md transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75"
                             onClick={() => navigate(`/join/${meetId}?partnerName=${encodeURIComponent(partnerName || '')}&partnerAvatar=${encodeURIComponent(partnerAvatar || '')}&interestId=${encodeURIComponent(interestId || '')}&sessionId=${encodeURIComponent(sessionId || '')}&partnerId=${encodeURIComponent(otherUserEmail || '')}`)}>
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
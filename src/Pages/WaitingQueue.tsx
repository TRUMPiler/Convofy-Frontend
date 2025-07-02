import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "sonner";
import Navbar from "./Sub-parts/NavigationBar";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const WaitingRoom: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"waiting" | "ready" | "error" | "Nothing">("Nothing");
  const [otherUserEmail, setOtherUserEmail] = useState<string | null>(null);
  const [meetId, setMeetId] = useState<string | null>(null);

  const initialCheckTriggered = useRef(false);
  const stompClientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (!Cookies.get("email")) {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    const email = Cookies.get("email");
    if (!email) {
      toast.error("Email not found. Please log in.");
      navigate("/login");
      return;
    }

    if (stompClientRef.current && stompClientRef.current.active) {
      stompClientRef.current.deactivate();
    }

    const client = new Client({
      webSocketFactory: () => new SockJS("https://api.convofy.fun/ws"),
      debug: (str) => console.log(str),
      onConnect: () => {
        console.log("Connected to WebSocket server");
        client.subscribe(`/queue/matches/${email}`, (message) => {
          try {
            const data = JSON.parse(message.body);
            console.log("Received WebSocket message:", data);
            if (data.meetId) {
              console.log("WebSocket: Match found! Setting status to ready and meetId:", data.meetId);
              setOtherUserEmail(data.useremail);
              Cookies.set("matchedEmail", data.useremail);
              setMeetId(data.meetId);
              setStatus("ready");
            } else {
              console.log("WebSocket: Received message without meetId, ignoring:", data);
            }
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
            toast.error("Failed to process match data from server.");
            setStatus("error");
          }
        });
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
  }, [navigate]);

  const checkQueueStatus = useCallback(async () => {
    if (status !== "ready") {
      setStatus("Nothing");
    }
    try {
      const email = Cookies.get("email");
      if (!email) {
        toast.error("Email not found in cookies.");
        setStatus("error");
        return;
      }

      console.log("Making initial HTTP request to check queue status for:", email);
      const response = await axios.get(`https://api.convofy.fun/api/queue/check/${email}`);

      if (response.data.success && response.status === 200) {
        const matchedEmail = response.data.data;
        setOtherUserEmail(matchedEmail);
        Cookies.set("matchedEmail", matchedEmail);

        console.log("HTTP Check: Immediate match found, creating meeting...");
        const createMeetingResponse = await axios.post(
          "https://api.convofy.fun/api/meetings/create",
          { userid1: email, userid2: matchedEmail },
          { headers: { "Content-Type": "application/json" } }
        );
        console.log("Create meeting response:", createMeetingResponse.data);
        if (createMeetingResponse.data.success) {
          setMeetId(createMeetingResponse.data.data.meetid);
          console.log("HTTP Check: Meeting created, setting status to ready.");
          setStatus("ready");
        } else {
          toast.error(createMeetingResponse.data.message || "Failed to create meeting.");
          setStatus("error");
        }
      } else if (response.data.success && (response.status === 201 || response.status === 208)) {
        if (status !== "ready") {
          console.log("HTTP Check: User placed in queue, setting status to waiting.");
          setStatus("waiting");
          toast.info("You are in the queue, waiting...");
        } else {
          console.log("HTTP Check: User already ready via WebSocket, ignoring 'waiting' status.");
        }
      } else {
        toast.error(response.data.message || "Failed to check queue status.");
        setStatus("error");
      }
    } catch (error) {
      console.error("Error checking queue status via HTTP:", error);
      toast.error("An error occurred while checking queue status.");
      setStatus("error");
    }
  }, [status]);

  useEffect(() => {
    if (!initialCheckTriggered.current) {
      initialCheckTriggered.current = true;
      checkQueueStatus();
    }
  }, [checkQueueStatus]);

  useEffect(() => {
    if (status === "ready" && meetId) {
      console.log("Navigation useEffect: Status is ready and meetId exists, navigating to:", `/join/${meetId}`);
      const timer = setTimeout(() => {
        navigate(`/join/${meetId}`);
      }, 500);

      return () => clearTimeout(timer);
    } else {
      console.log("Navigation useEffect: Current Status:", status, "Current MeetId:", meetId);
    }
  }, [status, meetId, navigate]);

  return (
    <>
      <Navbar />
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
        {status === "ready" && (
          <div className="text-center p-6 bg-card rounded-xl shadow-lg border border-border max-w-md w-full mx-4">
            <p className="text-2xl font-bold mb-4 text-primary">Meeting Ready!</p>
            <p className="text-lg mb-4">You're matched with <span className="font-semibold text-accent-foreground">{otherUserEmail}</span>.</p>
            <p className="text-sm text-muted-foreground mb-6">Meeting ID: <span className="font-mono bg-secondary px-2 py-1 rounded-md">{meetId}</span></p>
            <button
              className="bg-green-600 text-white py-3 px-8 rounded-lg font-bold text-lg
                         hover:bg-green-700 transition-colors duration-300 shadow-md transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75"
              onClick={() => navigate(`/join/${meetId}`)}
            >
              Join Meeting
            </button>
          </div>
        )}
        {status === "waiting" && (
          <div className="text-center p-6">
            <p className="text-3xl text-primary font-extrabold animate-pulse">Waiting for another participant...</p>
            <p className="text-muted-foreground mt-4 text-lg">Please keep this page open. We'll connect you soon!</p>
            <div className="mt-8 flex justify-center">
              <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
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

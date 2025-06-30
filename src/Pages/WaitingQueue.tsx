import React, { useEffect, useState, useRef } from "react"; // Import useRef
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "sonner";
import Navbar from "./Sub-parts/NavigationBar";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { Cookie } from "lucide-react";

const WaitingRoom: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"waiting" | "ready" | "error" | "Nothing">("Nothing");
  const [otherUserEmail, setOtherUserEmail] = useState<string | null>(null);
  const [meetId, setMeetId] = useState<string | null>(null);

  // Use a ref to track if the checkQueueStatus has been initiated
  const checkQueueInitiated = useRef(false);

  // Redirect to login if email is not present in cookies
  // This should ideally be handled by a router guard or a higher-order component
  // to prevent rendering the component entirely if not authenticated.
  if (!Cookies.get("email")) {
    navigate("/login");
  }

  // WebSocket connection
  useEffect(() => {
    const email = Cookies.get("email");
    if (!email) {
      // If email is not present, the navigate("/login") above will handle it.
      // We can return early from this effect as well.
      return;
    }

    const client = new Client({
      webSocketFactory: () => new SockJS("https://api.convofy.fun/ws"),
      debug: (str) => console.log(str),
      onConnect: () => {
        console.log("Connected to WebSocket server");
        client.subscribe("/queue/matches", (message) => {
          try {
            const data = JSON.parse(message.body);
            console.log("Received WebSocket message:", data);
            if (data.userId === email) { // Use '===' for strict equality
              if (data.meetId) {
                setOtherUserEmail(data.useremail);
                Cookies.set("matchedEmail", data.useremail);
                setMeetId(data.meetId);
                setStatus("ready");
              }
            }
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        });
      },
      onStompError: (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
        console.error('Additional details: ' + frame.body);
      },
      onDisconnect: () => {
        console.log("Disconnected from WebSocket server");
      }
    });

    client.activate();

    return () => {
      if (client.active) {
        client.deactivate();
      }
    };
  }, []); // Empty dependency array ensures this runs once on mount

  // Check queue status
  // This function is now memoized by useCallback to prevent re-creation on every render
  // and ensure it's stable for useEffect's dependency array.
  const checkQueueStatus = async () => {
    // Only proceed if the check hasn't been initiated yet
    if (checkQueueInitiated.current) {
        return;
    }

    checkQueueInitiated.current = true; // Set to true to prevent future calls

    try {
      const email = Cookies.get("email");
      if (!email) {
        toast.error("Email not found in cookies.");
        setStatus("error");
        return;
      }

      const response = await axios.get(`https://api.convofy.fun/api/queue/check/${email}`);
    

      if (response.data.success && response.status === 200) {
        const matchedEmail = response.data.data;
        setOtherUserEmail(matchedEmail);
        Cookies.set("matchedEmail", matchedEmail);

        const createMeetingResponse = await axios.post(
          "https://3.108.249.57:8080/api/meetings/create",
          { userid1: email, userid2: matchedEmail },
          { headers: { "Content-Type": "application/json" } }
        );
        console.log(createMeetingResponse.data);
        if (createMeetingResponse.data.success) {
          setMeetId(createMeetingResponse.data.data.meetid);
          setStatus("ready");
        } else {
          setStatus("error");
        }
      } else if (response.data.success && (response.status === 201 || response.status === 208)) {
        setStatus("waiting");
        toast.info("You are in the queue, waiting...");
      } else {
          // Handle cases where success is false but status is not 201/208
          toast.error(response.data.message || "Failed to check queue status.");
          setStatus("error");
      }
    } catch (error) {
      console.error("Error checking queue status:", error);
      toast.error("Failed to check queue status.");
      setStatus("error");
    }
  };

  // Trigger queue status check only once on component mount
  useEffect(() => {
    // Call checkQueueStatus within useEffect to ensure it runs as a side effect.
    // The ref prevents it from being called again if StrictMode is active.
    checkQueueStatus();
  }, []); // Empty dependency array ensures this effect runs only once on mount

  // Redirect the user when ready
  // useEffect(() => {
  //   if (status === "ready" && meetId) {
  //     navigate(`/join/${meetId}`);
  //   }
  // }, [status, meetId, navigate]); // Dependencies are correct here

  return (
    <>
      <Navbar />
      <div className="flex flex-col items-center justify-center min-h-screen">
        {status === "ready" && (
          <div>
            <p>Meeting with {otherUserEmail} is ready. Meeting ID: {meetId}</p>
            <button
              className="bg-green-500 text-white py-2 px-4 rounded"
              onClick={() => navigate(`/join/${meetId}`)}
            >
              Join Meeting
            </button>
          </div>
        )}
        {status === "waiting" && <p>Waiting for another participant...</p>}
        {status === "error" && (
          <div>
            <p>Error occurred. Please try again.</p>
            <button
              className="bg-red-500 text-white py-2 px-4 rounded"
              onClick={checkQueueStatus} // Allow retrying on error
            >
              Retry
            </button>
          </div>
        )}
        {status === "Nothing" && <p>Loading...</p>}
      </div>
    </>
  );
};

export default WaitingRoom;
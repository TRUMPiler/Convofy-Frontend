import React, { useEffect, useState } from "react";
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
  const [Userid2, setUserid2] = useState<string | null>(null);  
  const [meetId, setMeetId] = useState<string | null>(null);
  const [gotuser, setGotuser] = useState<boolean|null>(true);

  if (!Cookies.get("userId")) {
    navigate("/login");
  }

  useEffect(() => {
    // WebSocket listener for meeting ID updates
    const fetchMeetId = () => {
      const client = new Client({
        webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
        debug: (str) => console.log(str),
        onConnect: () => {
          console.log("Connected to WebSocket server");
          client.subscribe("/queue/matches", (message) => {
            console.log("Received message:", message.body);
            const userid=Cookies.get("userId");
            try {
              const data = JSON.parse(message.body);
              if (data.userId!==userid) {
                
              }
              if (data.meetId) {
                setMeetId(data.meetId);
                setStatus("ready");
              }
            } catch (error) {
              console.error("Error parsing message:", error);
            }
          });
        },
        onDisconnect: () => console.log("Disconnected from WebSocket server"),
      });

      client.activate();

      // Cleanup WebSocket connection
      return () => {
        if (client.active) {
          client.deactivate();
        }
      };
    };

    if (status === "waiting") {
      fetchMeetId();
    }
  }, [status]);

  const checkQueueStatus = async () => {
    try {
      const userId = Cookies.get("userId");
      if (status === "ready") return;

      if (!userId) {
        toast.error("User ID not found in cookies.");
        setStatus("error");
        return;
      }

      const response = await axios.get(`http://localhost:8080/api/queue/check/${userId}`);
      console.log(response.data);

      if (response.data.success && response.status === 200) {
        console.log("Matched with:", response.data.data);
        const createmeetingResponse = await axios.post(
          "http://localhost:8080/api/meetings/create",
          {
            userid1: userId,
            userid2: response.data.data,
          },
          { headers: { "Content-Type": "application/json" } }
        );

        console.log(createmeetingResponse.data);
        if (createmeetingResponse.data.success) {
          setMeetId(createmeetingResponse.data.data.meetid);
          Cookies.set("Sessionid", createmeetingResponse.data.data.sessionid);
          setStatus("ready");
        } else {
          setStatus("error");
          console.log("Error creating meeting");
        }
      } else if (response.data.success && response.status === 201) {
        setStatus("waiting");
        toast.info("You are in the queue, waiting...");
      } else if (response.data.success && response.status === 208) {
        setStatus("waiting");
        toast.info("You are already in the queue, waiting...");
      }
    } catch (error) {
      console.error("Error checking queue status:", error);
      setStatus("error");
    }
  };

  useEffect(() => {
    // Redirect the user when ready
    if (status === "ready" && meetId) {
      navigate(`/join/${meetId}`);
    }
  }, [status, meetId, navigate]);

  const joinMeeting = () => {
    if (meetId) {
      window.location.href = `/join/${meetId}`;
    }
  };

  useEffect(() => {
    setTimeout(() => {
      checkQueueStatus();
    }, 1000);
  }, [gotuser]);

  return (
    <>
      <Navbar />
      <div className="flex flex-col items-center justify-center min-h-screen">
        
        {status === "ready" && (
          <div>
            <p>Meeting with {Userid2} is ready. Meeting ID: {meetId}</p>
            <button
              className="bg-green-500 text-white py-2 px-4 rounded"
              onClick={joinMeeting}
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
              onClick={checkQueueStatus}
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

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { Cookie } from "lucide-react";
import Navbar from "./Sub-parts/NavigationBar";

const WaitingRoom: React.FC = () => {
      const navigate = useNavigate();
    if(!Cookies.get("userId"))
    {
      navigate("/login");
    } 
  const [status, setStatus] = useState<"waiting" | "ready" | "error">("waiting");
  const [Userid2, setUserid2] = useState<string | null>(null);

    var OtherPersonUserid="";
  const checkQueueStatus = async () => {
    try {
      const userId = Cookies.get("userId");
      
      if (!userId) {
        toast.error("User ID not found in cookies.");
        setStatus("error");
        return;
      }

      const response = await axios.get(
        `http://localhost:8080/api/queue/check/${userId}`
      );

      if (response.data.success&&response.status==200) {
        // navigate(`/meeting/${response.data.meetingId}`);
        OtherPersonUserid = response.data;
        setStatus("ready");
        setUserid2(response.data.data);
        console.log(response.data);
        
      }
      else if(response.data.success&&response.status==208)
      {
        toast.message("You are in a queue Waiting");
      }
      
    } catch (error) {
      console.error("Error checking queue status:", error);
      toast.error("Failed to check queue status.");
      setStatus("error");
    }
  };

  const createMeeting = async () => {
    try {
      const userId = Cookies.get("userId");
      if (!userId) {
        toast.error("User ID not found in cookies.");
        setStatus("error");
        return;
      }
      if (!Userid2) {
        toast.error("Otherpersonuseridnotfound");
        console.log(OtherPersonUserid);
        setStatus("error");
        return;
      }
      const response = await axios.post("http://localhost:8080/api/meetings/create", { userid1:userId,userid2:Userid2 });
      console.log(response);
      if (response.data.success&&response.status==201) {
        // navigate(`/meeting/${response.data.meetingId}`);
        console.log(response.data.data.meetid);
        window.location.href = `/join/${response.data.data.meetid}`;
      }
    } catch (error) {
      console.error("Error creating meeting:", error);
      toast.error("Failed to create meeting.");
      setStatus("error");
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      checkQueueStatus();
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <>
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-screen">
            {status === "ready" && (
                <div>
                    <p>Meeting with {Userid2} is ready</p>
                    <button onClick={createMeeting}>Create Meeting</button> 
                </div>  
            )}
      {status === "waiting" && <p>Waiting for another participant...</p>}
      {status === "error" && (
        <div>
          <p>Error occurred. Please try again.</p>
          <button onClick={createMeeting}>Create Meeting</button>
        </div>
      )}
    </div>
    </>

  );
};

export default WaitingRoom;

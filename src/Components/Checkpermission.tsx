import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Cookies from "js-cookie";

const PermissionsSetup: React.FC<{ link: string }> = (props: { link: string }) => {
  const [videoPermission, setVideoPermission] = useState<boolean | null>(null);
  const [audioPermission, setAudioPermission] = useState<boolean | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
 const checkServerForQueue = async () => {
        window.location.href = "./Waiting"
  };

 


  const redirectToMeeting = (meetId: string) => {
    window.location.href = `/meeting/${meetId}`;
  };
  const checkPermissions = async () => {
    try {
      // Request video and audio permissions
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setVideoPermission(true);
      setAudioPermission(true);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Stop video and audio stream after permissions granted
      setTimeout(() => {
        stream.getTracks().forEach((track) => track.stop());
        
      }, 2000);
    } catch (error) {
      console.error("Permission error:", error);
      setVideoPermission(false);
      setAudioPermission(false);
    }
  };

 

  useEffect(() => {
    checkPermissions();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-xl font-bold mb-4">Audio & Video Permissions</h1>
      {videoPermission === null || audioPermission === null ? (
        <p>Checking permissions...</p>
      ) : videoPermission && audioPermission ? (
        <div className="flex flex-col items-center">
          <p className="text-green-600">Permissions granted! Searching for a match...</p>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            disablePictureInPicture
            controls={false}
            muted
            style={{ width: "300px", height: "200px", border: "1px solid white" }}
          />
             <button
            onClick={checkServerForQueue}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded shadow"
          >
            Enter the queue?
          </button>
        </div>
        
      ) : (
        <div className="flex flex-col items-center">
          <p className="text-red-600">
            Permissions denied! Please enable audio and video permissions.
          </p>
          <button
            onClick={checkPermissions}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded shadow"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
};

export default PermissionsSetup;

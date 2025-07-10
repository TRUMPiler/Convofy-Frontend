import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate if not already
import { toast } from 'sonner'; // Assuming you have sonner for toasts
import Cookies from "js-cookie";
import axios from "axios";
// Add a prop type for interestId
const PermissionsSetup: React.FC<{ interestId?: string }> = ({ interestId }) => {
    const navigate = useNavigate(); // Initialize useNavigate
    const [videoPermission, setVideoPermission] = useState<boolean | null>(null);
    const [audioPermission, setAudioPermission] = useState<boolean | null>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);

    const checkServerForQueue = async () => {
        // 2. Redirect user to /waiting/{interestId}
        if (interestId) {
            navigate(`/waiting/${interestId}`);
            toast.info("Entering the queue..."); // Optional: A toast to confirm action
        } else {
            toast.error("Interest ID is missing. Cannot enter the queue.");
        }
    };
 const handleLeaveQueue = async () => {
        const userId = Cookies.get("userId");
        const jwtToken = Cookies.get("jwtToken");

        if (!userId || !jwtToken) {
            toast.error("User ID or JWT token missing. Cannot leave queue.");
            return;
        }

        try {
           
                toast.success('Successfully left the queue.');
                navigate(`/chatroom/${interestId}`);
            
        } catch (error: any) {
            navigate(`/chatroom/${interestId}`);
            console.error('Error leaving queue:', error);
            toast.error('An error occurred while leaving the queue.');
        }
    };
    const checkPermissions = async () => {
        try {
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
                            onClick={handleLeaveQueue}
                            className="mt-8 bg-red-600 text-white py-3 px-8 rounded-lg font-bold text-lg
                                         hover:bg-red-700 transition-colors duration-300 shadow-md transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75"
                        >
                            Leave Queue
                        </button>
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
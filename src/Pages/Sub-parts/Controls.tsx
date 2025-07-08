import React from 'react';
import { useMeeting } from "@videosdk.live/react-sdk";

interface ControlsProps {
    onLeaveMeeting: () => void;
    interestId: string;
}

const Controls: React.FC<ControlsProps> = ({ onLeaveMeeting, interestId }) => {
    const { toggleMic, toggleWebcam, localParticipant } = useMeeting();

    const isMicOn = localParticipant?.micOn;
    const isWebcamOn = localParticipant?.webcamOn;

    return (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-4 bg-gray-900 bg-opacity-70 p-3 rounded-full shadow-lg z-10">
            <button
                onClick={() => toggleMic()}
                className={`p-3 rounded-full ${isMicOn ? 'bg-green-500' : 'bg-red-500'} text-white focus:outline-none transition-colors duration-200 hover:scale-105`}
                title={isMicOn ? "Mute Mic" : "Unmute Mic"}
            >
                {isMicOn ? '🎤' : '🔇'}
            </button>
            <button
                onClick={() => toggleWebcam()}
                className={`p-3 rounded-full ${isWebcamOn ? 'bg-green-500' : 'bg-red-500'} text-white focus:outline-none transition-colors duration-200 hover:scale-105`}
                title={isWebcamOn ? "Turn off Webcam" : "Turn on Webcam"}
            >
                {isWebcamOn ? '📹' : '📷'}
            </button>
            <button
                onClick={onLeaveMeeting}
                className="p-3 rounded-full bg-red-600 text-white hover:bg-red-700 focus:outline-none transition-colors duration-300 hover:scale-105"
                title="Leave Call"
            >
                👋
            </button>
        </div>
    );
};

export default Controls;
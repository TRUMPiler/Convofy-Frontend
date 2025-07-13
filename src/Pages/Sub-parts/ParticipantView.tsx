import React, { useEffect, useMemo, useRef } from "react";
import { useParticipant } from "@videosdk.live/react-sdk";
import ReactPlayer from "react-player";
import NetworkStatusIndicator from './NetworkComponent'; // Import the new component

interface ParticipantViewProps {
  participantId: string;
  partnerAvatar?: string;
  isLocalUser: boolean;
}

const ParticipantView: React.FC<ParticipantViewProps> = ({ participantId, partnerAvatar, isLocalUser }) => {
  const micRef = useRef<HTMLAudioElement | null>(null);

  // Destructure getAudioStats and getVideoStats to pass them to NetworkStatusIndicator
  const { webcamStream, micStream, webcamOn, micOn, displayName, getAudioStats, getVideoStats } =
    useParticipant(participantId);

  const videoStream = useMemo(() => {
    if (webcamOn && webcamStream) {
      const mediaStream = new MediaStream();
      mediaStream.addTrack(webcamStream.track);
      return mediaStream;
    }
    return null;
  }, [webcamStream, webcamOn]);

  useEffect(() => {
    if (micRef.current) {
      if (micOn && micStream) {
        const mediaStream = new MediaStream();
        mediaStream.addTrack(micStream.track);
        micRef.current.srcObject = mediaStream;
        if (!isLocalUser) {
          micRef.current
            .play()
            .catch((error) =>
              console.error("Audio playback failed for participant:", displayName, error)
            );
        }
      } else {
        micRef.current.srcObject = null;
      }
    }
  }, [micStream, micOn, displayName, isLocalUser]);

  const avatarToDisplay = useMemo(() => {
    if (!webcamOn) {
      if (isLocalUser) {
        return `https://placehold.co/96x96/cccccc/333333?text=${displayName?.charAt(0) || '?'}`;
      } else {
        return partnerAvatar || `https://placehold.co/96x96/cccccc/333333?text=${displayName?.charAt(0) || '?'}`;
      }
    }
    return null;
  }, [webcamOn, isLocalUser, displayName, partnerAvatar]);

  return (
    <div className="relative w-full h-full bg-gray-800 rounded-lg overflow-hidden shadow-lg flex items-center justify-center aspect-video sm:aspect-auto">
      {webcamOn ? (
        <ReactPlayer
          playsinline
          pip={false}
          light={false}
          controls={false}
          muted={isLocalUser}
          playing={true}
          url={videoStream as MediaStream}
          height="100%"
          width="100%"
          className="object-cover"
          style={isLocalUser ? { transform: 'scaleX(-1)' } : {}}
          onError={(err) => {
            console.error("Participant video error:", displayName, err);
          }}
        />
      ) : (
        <div className="flex flex-col items-center justify-center h-full w-full bg-gray-700 text-white text-lg p-4">
          {avatarToDisplay && (
            <img
              src={avatarToDisplay}
              alt={displayName || "Participant"}
              className="w-24 h-24 rounded-full object-cover mb-2 border-2 border-primary"
              onError={(e) => { e.currentTarget.src = `https://placehold.co/96x96/cccccc/333333?text=${displayName?.charAt(0) || '?'}`; }}
            />
          )}
          {!avatarToDisplay && (
            <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center text-3xl font-bold">
              {displayName ? displayName.charAt(0).toUpperCase() : '?'}
            </div>
          )}
          <p className="mt-2 text-center">{displayName || "Unknown"}</p>
          <p className="text-sm text-gray-400">Webcam OFF</p>
        </div>
      )}

      {/* Display Name, Mic Status, and the NetworkStatusIndicator component */}
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-md flex items-center">
        <span>{displayName} {isLocalUser && "(You)"}</span>
        <span className={`ml-2 ${micOn ? 'text-green-400' : 'text-red-400'}`}>
          {micOn ? '🎤' : '🔇'}
        </span>
        {/* Render the NetworkStatusIndicator here, passing necessary props */}
        <NetworkStatusIndicator
          participantId={participantId}
          micOn={micOn}
          webcamOn={webcamOn}
          getAudioStats={getAudioStats}
          getVideoStats={getVideoStats}
          displayName={displayName}
        />
      </div>
      <audio ref={micRef} autoPlay muted={isLocalUser} />
    </div>
  );
}

// It's highly recommended to memoize ParticipantView itself to prevent
// unnecessary re-renders from its parent (e.g., MeetingRoom).
export default React.memo(ParticipantView);

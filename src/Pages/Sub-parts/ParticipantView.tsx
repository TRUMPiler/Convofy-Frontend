import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useParticipant } from "@videosdk.live/react-sdk";
import ReactPlayer from "react-player";

interface ParticipantViewProps {
  participantId: string;
  partnerAvatar?: string;
  isLocalUser: boolean;
}

const ParticipantView: React.FC<ParticipantViewProps> = ({ participantId, partnerAvatar, isLocalUser }) => {
  const micRef = useRef<HTMLAudioElement | null>(null);
  const [networkStats, setNetworkStats] = useState<{ rtt?: number; packetsLost?: number; totalPackets?: number } | null>(null);

  // Removed networkQuality from destructuring as it's not directly returned
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


  // Function to fetch network statistics
  const fetchNetworkStats = useCallback(async () => {
    try {
      let stats;
      if (webcamOn) {
        // Prioritize video stats if webcam is on
        const videoStats = await getVideoStats();
        stats = videoStats[0]; // Assuming one video track per participant
      } else if (micOn) {
        // Otherwise, get audio stats if mic is on
        const audioStats = await getAudioStats();
        stats = audioStats[0]; // Assuming one audio track per participant
      }

      if (stats) {
        setNetworkStats({
          rtt: stats.rtt,
          packetsLost: stats.packetsLost,
          totalPackets: stats.totalPackets,
        });
      } else {
        setNetworkStats(null); // No active stream to get stats from
      }
    } catch (error) {
      console.error("Error fetching network stats for participant", displayName, error);
      setNetworkStats(null);
    }
  }, [webcamOn, micOn, getAudioStats, getVideoStats, displayName]);

  // Periodically fetch network stats
  useEffect(() => {
    // Only fetch stats if there's an active stream (webcam or mic)
    if (webcamOn || micOn) {
      fetchNetworkStats(); // Fetch immediately on mount/stream change
      const interval = setInterval(fetchNetworkStats, 3000); // Fetch every 3 seconds
      return () => clearInterval(interval); // Cleanup interval on unmount
    } else {
      setNetworkStats(null); // Clear stats if no stream is active
    }
  }, [webcamOn, micOn, fetchNetworkStats]);


  // Function to determine network status text and color based on fetched stats
  const getNetworkStatus = useCallback(() => {
    if (!networkStats) {
      return { text: "N/A", color: "text-gray-400" };
    }

    const { rtt, packetsLost, totalPackets } = networkStats;

    let rttQuality: 'Excellent' | 'Good' | 'Poor' = 'Excellent';
    if (rtt === undefined || rtt === null) {
      rttQuality = 'Poor'; // Treat unknown RTT as poor
    } else if (rtt > 150) {
      rttQuality = 'Poor';
    } else if (rtt > 50) {
      rttQuality = 'Good';
    }

    let packetLossQuality: 'Excellent' | 'Good' | 'Poor' = 'Excellent';
    if (packetsLost === undefined || totalPackets === undefined || totalPackets === 0) {
      packetLossQuality = 'Poor'; // Treat unknown/no packets as poor
    } else {
      const lossPercentage = (packetsLost / totalPackets) * 100;
      if (lossPercentage > 2) {
        packetLossQuality = 'Poor';
      } else if (lossPercentage > 0) {
        packetLossQuality = 'Good';
      }
    }

    // Combine RTT and Packet Loss for overall quality
    if (rttQuality === 'Poor' || packetLossQuality === 'Poor') {
      return { text: "Poor", color: "text-red-400" };
    } else if (rttQuality === 'Good' || packetLossQuality === 'Good') {
      return { text: "Good", color: "text-yellow-400" };
    } else {
      return { text: "Excellent", color: "text-green-400" };
    }
  }, [networkStats]);

  const { text: networkStatusText, color: networkStatusColor } = getNetworkStatus();

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
          style={isLocalUser ? { transform: 'scaleX(-1)' } : { transform: 'scaleX(-1)' }}
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

      {/* Display Name, Mic Status, and Network Status */}
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-md flex items-center">
        <span>{displayName} {isLocalUser && "(You)"}</span>
        <span className={`ml-2 ${micOn ? 'text-green-400' : 'text-red-400'}`}>
          {micOn ? '🎤' : '🔇'}
        </span>
        <span className={`ml-2 ${networkStatusColor}`}>
          {networkStatusText}
        </span>
      </div>
      <audio ref={micRef} autoPlay muted={isLocalUser} />
    </div>
  );
}

export default ParticipantView;

import React, { useState, useEffect, useCallback, useMemo } from "react";
// We need useParticipant here to access getAudioStats and getVideoStats
import { useParticipant } from "@videosdk.live/react-sdk";

interface NetworkStatusIndicatorProps {
  participantId: string; // We need this to get stats for the specific participant
  micOn: boolean;
  webcamOn: boolean;
  // We will pass these functions down from useParticipant in ParticipantView
  getAudioStats: () => Promise<any[]>;
  getVideoStats: () => Promise<any[]>;
  displayName: string; // For console logging errors
}

const NetworkStatusIndicator: React.FC<NetworkStatusIndicatorProps> = ({
  participantId,
  micOn,
  webcamOn,
  getAudioStats,
  getVideoStats,
  displayName,
}) => {
  // State to hold network statistics
  const [networkStats, setNetworkStats] = useState<{ rtt?: number; packetsLost?: number; totalPackets?: number } | null>(null);

  // Memoized function to fetch network statistics
  const fetchNetworkStats = useCallback(async () => {
    try {
      let stats;
      if (webcamOn) {
        const videoStats = await getVideoStats();
        // Assuming videoStats[0] contains the relevant stats for the main video track
        stats = videoStats[0];
      } else if (micOn) {
        const audioStats = await getAudioStats();
        // Assuming audioStats[0] contains the relevant stats for the main audio track
        stats = audioStats[0];
      }

      if (stats) {
        setNetworkStats({
          rtt: stats.rtt,
          packetsLost: stats.packetsLost,
          totalPackets: stats.totalPackets,
        });
      } else {
        // Clear stats if no active stream (e.g., mic and webcam are off)
        setNetworkStats(null);
      }
    } catch (error) {
      console.error(`Error fetching network stats for ${displayName} (ID: ${participantId}):`, error);
      setNetworkStats(null); // Clear stats on error
    }
  }, [webcamOn, micOn, getAudioStats, getVideoStats, displayName, participantId]); // Dependencies for useCallback

  // Effect to set up and clear the polling interval
  useEffect(() => {
    // Only poll for stats if webcam or mic is active
    if (webcamOn || micOn) {
      fetchNetworkStats(); // Fetch stats immediately on mount/stream change
      // *** Optimized Interval: Poll every 5 seconds (5000ms) within this isolated component ***
      const interval = setInterval(fetchNetworkStats, 5000);
      return () => clearInterval(interval); // Cleanup the interval on unmount
    } else {
      setNetworkStats(null); // Clear stats if no active stream
    }
  }, [webcamOn, micOn, fetchNetworkStats]); // Dependencies for useEffect

  // Memoized function to determine network status text and color
  const getNetworkStatus = useCallback(() => {
    if (!networkStats) {
      return { text: "N/A", color: "text-gray-400" };
    }

    const { rtt, packetsLost, totalPackets } = networkStats;

    let rttQuality: 'Excellent' | 'Good' | 'Poor' = 'Excellent';
    // Check RTT (Round Trip Time)
    if (rtt === undefined || rtt === null) {
      rttQuality = 'Poor'; // No RTT data
    } else if (rtt > 150) { // High RTT indicates poor connection
      rttQuality = 'Poor';
    } else if (rtt > 50) { // Moderate RTT
      rttQuality = 'Good';
    }

    let packetLossQuality: 'Excellent' | 'Good' | 'Poor' = 'Excellent';
    // Check Packet Loss
    if (packetsLost === undefined || totalPackets === undefined || totalPackets === 0) {
      packetLossQuality = 'Poor'; // No packet loss data or no packets sent
    } else {
      const lossPercentage = (packetsLost / totalPackets) * 100;
      if (lossPercentage > 2) { // More than 2% loss is generally poor
        packetLossQuality = 'Poor';
      } else if (lossPercentage > 0) { // Some loss
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
  }, [networkStats]); // Re-run if networkStats change

  const { text: networkStatusText, color: networkStatusColor } = getNetworkStatus();

  return (
    <>
   
    <span className={`ml-2 ${networkStatusColor}`}>
      {networkStatusText}
    </span>
    </>
  );
};

// *** Crucial for performance: Memoize this component ***
// This prevents it from re-rendering unless its props change,
// which only happens when micOn/webcamOn or the getStats functions change.
export default React.memo(NetworkStatusIndicator);
import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from '../Components/ui/button';
import { ScrollArea } from '../Components/ui/scroll-area';
import axios from 'axios';

interface Friend {
  id: string;
  friendInfo: UserBasicInfoDTO;
}

interface UserBasicInfoDTO {
  userId: string;
  name: string;
  email: string;
  avatar: string;
}

interface IncomingFriendRequest {
  requestId: string;
  createdAt: string;
  sender: UserBasicInfoDTO;
}

interface OutgoingFriendRequest {
  requestId: string;
  createdAt: string;
  receiver: UserBasicInfoDTO;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
}

interface FriendListPopupProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
}

const FriendListPopup: React.FC<FriendListPopupProps> = ({ isOpen, onClose, currentUserId }) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<IncomingFriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<OutgoingFriendRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const API_BASE_URL = 'https://api.convofy.fun/api/friends';

  const fetchFriendData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const friendsResponse = await axios.get<ApiResponse<Friend[]>>(`${API_BASE_URL}/list/${currentUserId}`);
      console.log("friendsResponse.data:", friendsResponse.data);
      if (friendsResponse.data.success && friendsResponse.data.data) {
        setFriends(friendsResponse.data.data);
      } else {
        setError(prev => prev ? prev + "; " + (friendsResponse.data.message || 'Failed to fetch friends list') : (friendsResponse.data.message || 'Failed to fetch friends list'));
      }

      const incomingResponse = await axios.get<ApiResponse<IncomingFriendRequest[]>>(`${API_BASE_URL}/requests/incoming?userId=${currentUserId}`);
      if (incomingResponse.data.success && incomingResponse.data.data) {
        setIncomingRequests(incomingResponse.data.data);
      } else {
        setError(prev => prev ? prev + "; " + (incomingResponse.data.message || 'Failed to fetch incoming requests') : (incomingResponse.data.message || 'Failed to fetch incoming requests'));
      }

      const outgoingResponse = await axios.get<ApiResponse<OutgoingFriendRequest[]>>(`${API_BASE_URL}/requests/outgoing?userId=${currentUserId}`);
      if (outgoingResponse.data.success && outgoingResponse.data.data) {
        setOutgoingRequests(outgoingResponse.data.data);
      } else {
        setError(prev => prev ? prev + "; " + (outgoingResponse.data.message || 'Failed to fetch outgoing requests') : (outgoingResponse.data.message || 'Failed to fetch outgoing requests'));
      }

    } catch (e: any) {
      console.error("Error fetching friend data:", e);
      if (axios.isAxiosError(e) && e.response) {
        setError(`Error fetching friend data: ${e.response.status} - ${e.response.data?.message || e.message}`);
      } else {
        setError(`Error fetching friend data: ${e.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, [currentUserId, API_BASE_URL]);

  useEffect(() => {
    if (isOpen && currentUserId) {
      fetchFriendData();
    }
  }, [isOpen, currentUserId, fetchFriendData]);

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const response = await axios.put<ApiResponse<string>>(`${API_BASE_URL}/update/${requestId}?currentuserid=${currentUserId}`);
      const result = response.data;

      if (result.success) {
        fetchFriendData();
      } else {
        setError(result.message || 'Failed to accept friend request');
      }
    } catch (e: any) {
      console.error("Error accepting request:", e);
      if (axios.isAxiosError(e) && e.response) {
        setError(`Error accepting request: ${e.response.status} - ${e.response.data?.message || e.message}`);
      } else {
        setError(`Error accepting request: ${e.message}`);
      }
    }
  };

  const handleUnfriend = async (friendIdToUnfriend: string) => {
    try {
      const response = await axios.delete<ApiResponse<string>>(`${API_BASE_URL}/unfriend`, {
        data: { userId: currentUserId, friendId: friendIdToUnfriend },
      });
      const result = response.data;

      if (result.success) {
        fetchFriendData();
      } else {
        setError(result.message || 'Failed to unfriend');
      }
    } catch (e: any) {
      console.error("Error unfriending:", e);
      if (axios.isAxiosError(e) && e.response) {
        setError(`Error unfriending: ${e.response.status} - ${e.response.data?.message || e.message}`);
      } else {
        setError(`Error unfriending: ${e.message}`);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-white p-6 rounded-lg shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-800">Friend Management</DialogTitle>
          <DialogDescription className="text-gray-600">
            Manage your friends, incoming requests, and outgoing requests.
          </DialogDescription>
        </DialogHeader>

        {loading && <p className="text-center text-blue-500">Loading friend data...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}

        {!loading && !error && (
          <ScrollArea className="h-[400px] w-full rounded-md border p-4 mt-4">
            <h3 className="text-xl font-semibold mb-3 text-gray-700">Your Friends ({friends.length})</h3>
            {friends.length === 0 ? (
              <p className="text-gray-500">No friends yet. Send some requests!</p>
            ) : (
              <ul className="space-y-2">
                {friends.map((friend) => (
                  <li key={friend.id} className="flex items-center justify-between p-2 border rounded-md bg-gray-50">
                    <span className="font-medium text-gray-800">
                      {friend.friendInfo.name || `ID: ${friend.friendInfo.userId}`}
                    </span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleUnfriend(friend.friendInfo.userId)}
                      className="bg-red-500 hover:bg-red-600 text-white rounded-md px-3 py-1"
                    >
                      Unfriend
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            <hr className="my-6 border-t border-gray-200" />

            <h3 className="text-xl font-semibold mb-3 text-gray-700">Incoming Requests ({incomingRequests.length})</h3>
            {incomingRequests.length === 0 ? (
              <p className="text-gray-500">No incoming friend requests.</p>
            ) : (
              <ul className="space-y-2">
                {incomingRequests.map((request) => (
                  <li key={request.requestId} className="flex items-center justify-between p-2 border rounded-md bg-yellow-50">
                    <span className="font-medium text-gray-800">
                      From: {request.sender.name || request.sender.userId}
                    </span>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleAcceptRequest(request.requestId)}
                      className="bg-green-500 hover:bg-green-600 text-white rounded-md px-3 py-1"
                    >
                      Accept
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            <hr className="my-6 border-t border-gray-200" />

            <h3 className="text-xl font-semibold mb-3 text-gray-700">Outgoing Requests ({outgoingRequests.length})</h3>
            {outgoingRequests.length === 0 ? (
              <p className="text-gray-500">No pending outgoing friend requests.</p>
            ) : (
              <ul className="space-y-2">
                {outgoingRequests.map((request) => (
                  <li key={request.requestId} className="flex items-center justify-between p-2 border rounded-md bg-blue-50">
                    <span className="font-medium text-gray-800">
                      To: {request.receiver.name || request.receiver.userId}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      className="text-blue-600 border-blue-600 rounded-md px-3 py-1"
                    >
                      Pending
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
        )}

        <div className="flex justify-end mt-4">
          <Button onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md px-4 py-2">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FriendListPopup;

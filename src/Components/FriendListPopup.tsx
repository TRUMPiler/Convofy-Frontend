import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from '../Components/ui/button';
import { ScrollArea } from '../Components/ui/scroll-area';

interface Friend {
  id: string;
  userId: string;
  friendId: string;
  status: string;
}

interface IncomingFriendRequest {
  requestId: string;
  senderId: string;
  senderUsername: string;
}

interface OutgoingFriendRequest {
  requestId: string;
  receiverId: string;
  receiverUsername: string;
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

  useEffect(() => {
    if (!isOpen || !currentUserId) {
      return;
    }

    const fetchFriendData = async () => {
      setLoading(true);
      setError(null);
      try {
        const friendsResponse = await fetch(`${API_BASE_URL}/list/${currentUserId}`);
        if (!friendsResponse.ok) {
          throw new Error(`HTTP error! status: ${friendsResponse.status}`);
        }
        const friendsResult: ApiResponse<Friend[]> = await friendsResponse.json();
        if (friendsResult.success && friendsResult.data) {
          setFriends(friendsResult.data);
        } else {
          setError(friendsResult.message || 'Failed to fetch friends list');
        }

        const incomingResponse = await fetch(`${API_BASE_URL}/requests/incoming?userId=${currentUserId}`);
        if (!incomingResponse.ok) {
          throw new Error(`HTTP error! status: ${incomingResponse.status}`);
        }
        const incomingResult: ApiResponse<IncomingFriendRequest[]> = await incomingResponse.json();
        if (incomingResult.success && incomingResult.data) {
          setIncomingRequests(incomingResult.data);
        } else {
          setError(prev => prev ? prev + "; " + (incomingResult.message || 'Failed to fetch incoming requests') : (incomingResult.message || 'Failed to fetch incoming requests'));
        }

        const outgoingResponse = await fetch(`${API_BASE_URL}/requests/outgoing?userId=${currentUserId}`);
        if (!outgoingResponse.ok) {
          throw new Error(`HTTP error! status: ${outgoingResponse.status}`);
        }
        const outgoingResult: ApiResponse<OutgoingFriendRequest[]> = await outgoingResponse.json();
        if (outgoingResult.success && outgoingResult.data) {
          setOutgoingRequests(outgoingResult.data);
        } else {
          setError(prev => prev ? prev + "; " + (outgoingResult.message || 'Failed to fetch outgoing requests') : (outgoingResult.message || 'Failed to fetch outgoing requests'));
        }

      } catch (e: any) {
        console.error("Error fetching friend data:", e);
        setError(`Error fetching friend data: ${e.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchFriendData();
  }, [isOpen, currentUserId, API_BASE_URL]);

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/update/${requestId}?currentuserid=${currentUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result: ApiResponse<string> = await response.json();
      if (result.success) {
        const friendsResponse = await fetch(`${API_BASE_URL}/list/${currentUserId}`);
        const friendsResult: ApiResponse<Friend[]> = await friendsResponse.json();
        if (friendsResult.success && friendsResult.data) {
          setFriends(friendsResult.data);
        }

        const incomingResponse = await fetch(`${API_BASE_URL}/requests/incoming?userId=${currentUserId}`);
        const incomingResult: ApiResponse<IncomingFriendRequest[]> = await incomingResponse.json();
        if (incomingResult.success && incomingResult.data) {
          setIncomingRequests(incomingResult.data);
        }
      } else {
        setError(result.message || 'Failed to accept friend request');
      }
    } catch (e: any) {
      console.error("Error accepting request:", e);
      setError(`Error accepting request: ${e.message}`);
    }
  };

  const handleUnfriend = async (friendIdToUnfriend: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/unfriend`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: currentUserId, friendId: friendIdToUnfriend }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result: ApiResponse<string> = await response.json();
      if (result.success) {
        setFriends(friends.filter(f => f.friendId !== friendIdToUnfriend && f.userId !== friendIdToUnfriend));
      } else {
        setError(result.message || 'Failed to unfriend');
      }
    } catch (e: any) {
      console.error("Error unfriending:", e);
      setError(`Error unfriending: ${e.message}`);
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
                      {friend.userId === currentUserId ? `Friend ID: ${friend.friendId}` : `Friend ID: ${friend.userId}`}
                    </span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleUnfriend(friend.userId === currentUserId ? friend.friendId : friend.userId)}
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
                      From: {request.senderUsername || request.senderId}
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
                      To: {request.receiverUsername || request.receiverId}
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

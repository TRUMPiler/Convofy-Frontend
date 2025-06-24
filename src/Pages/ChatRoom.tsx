// src/pages/ChatroomPage.tsx

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from './Sub-parts/NavigationBar';
import axios from 'axios';
import { toast } from 'sonner';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

// Define the structure for an Interest object received from the backend
interface Interest {
  interestId: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

// Define the structure for an OnlineUserDTO received from the backend
interface OnlineUser {
  userId: string;
  name: string;
  email: string;
  avatar: string;
}

// Define the structure for a ChatMessageResponseDTO received from the backend
interface ChatMessageResponse {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  time: string;
}

// Static data for demonstration purposes (these will remain as static examples)
const staticUsers = [
  { id: 'user1', name: 'CyberNomad', avatar: 'https://ui-avatars.com/api/?name=CN&background=random' },
  { id: 'user2', name: 'PixelDreamer', avatar: 'https://ui-avatars.com/api/?name=PD&background=random' },
  { id: 'user3', name: 'CodeWhisperer', avatar: 'https://ui-avatars.com/api/?name=CW&background=random' },
];

const staticMessages = [
  { id: 1, userId: 'user1', userName: 'CyberNomad', text: 'Hey everyone, glad to be here!', time: '10:00 AM' },
  { id: 2, userId: 'user2', userName: 'PixelDreamer', text: 'Me too! Loving the vibe of this chatroom.', time: '10:01 AM' },
  { id: 3, userId: 'user4', userName: 'DataSorcerer', text: 'Anyone else into indie games?', time: '10:03 AM' },
];


const ChatroomPage: React.FC = () => {
  const { chatroomId } = useParams<{ chatroomId: string }>();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [chatroomName, setChatroomName] = useState<string>('Loading Chatroom...');
  const [loadingChatroom, setLoadingChatroom] = useState(true);
  const [errorChatroom, setErrorChatroom] = useState<string | null>(null);

  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  const stompClient = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Function to get JWT from cookies
  const getJwtToken = () => {
    const name = 'jwtToken=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for(let i = 0; i <ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return '';
  };

  // Effect to scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [staticMessages]);

  // Main Effect for WebSocket connection and disconnection
  useEffect(() => {
    if (!chatroomId) {
      console.error('No chatroomId available for WebSocket connection.');
      return;
    }

    const jwtToken = getJwtToken();
    if (!jwtToken) {
      toast.error('Authentication required to join chatroom.');
      console.error('JWT Token not found. Cannot establish WebSocket connection.');
      return;
    }

    const socket = new SockJS('http://localhost:8080/ws');
    stompClient.current = Stomp.over(socket);

    const headers = {
      Authorization: `Bearer ${jwtToken}`,
    };

    stompClient.current.connect(headers, () => {
      console.log('Connected to WebSocket server!');

      stompClient.current.send(
        `/app/chat.joinRoom`,
        headers,
        JSON.stringify({ chatroomId: chatroomId })
      );
      console.log(`Sent join room message for chatroom: ${chatroomId}`);

      stompClient.current.subscribe(`/topic/chatroom/${chatroomId}/onlineUsers`, (message: any) => {
        const receivedUsers: OnlineUser[] = JSON.parse(message.body);
        setOnlineUsers(receivedUsers);
        console.log('Received online users update:', receivedUsers);
      }, headers);

    }, (error: any) => {
      console.error('WebSocket connection error:', error);
      toast.error('Failed to connect to chat. Please try again.');
    });

    // Cleanup function for component unmount (React's lifecycle)
    return () => {
      if (stompClient.current && stompClient.current.connected) {
        // Send leave room message
        stompClient.current.send(
          `/app/chat.leaveRoom`,
          headers,
          JSON.stringify({ chatroomId: chatroomId })
        );
        console.log(`Sent leave room message (on unmount) for chatroom: ${chatroomId}`);
        stompClient.current.disconnect(() => {
          console.log('Disconnected from WebSocket server (on unmount).');
        });
      }
    };
  }, [chatroomId]); // Re-run effect if chatroomId changes

  // NEW: Effect for beforeunload event
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Check if STOMP client is connected before attempting to send/disconnect
      if (stompClient.current && stompClient.current.connected) {
        const jwtToken = getJwtToken();
        const headers = { Authorization: `Bearer ${jwtToken}` };

        // Send leave room message
        stompClient.current.send(
          `/app/chat.leaveRoom`,
          headers,
          JSON.stringify({ chatroomId: chatroomId })
        );
        console.log(`Sent leave room message (on beforeunload) for chatroom: ${chatroomId}`);

        // Note: stompClient.disconnect() might not reliably complete in beforeunload
        // as the browser is tearing down the page.
        // The backend's disconnect listener is more robust for these scenarios.
        try {
          stompClient.current.disconnect(() => {
            console.log('Attempted disconnect on beforeunload.');
          }, 0); // Provide a short delay or 0 for immediate execution (best effort)
        } catch (e) {
          console.error("Error during STOMP disconnect on beforeunload:", e);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup for this specific effect: remove the event listener
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [chatroomId]); // Dependency on chatroomId for the handler to have the correct ID


  // Fetch the chatroom name (interest name)
  useEffect(() => {
    const fetchChatroomDetails = async () => {
      if (!chatroomId) {
        setChatroomName('Unknown Chatroom');
        setLoadingChatroom(false);
        return;
      }

      try {
        setLoadingChatroom(true);
        setErrorChatroom(null);
        const response = await axios.get(`http://localhost:8080/api/interests/${chatroomId}`);

        if (response.data.success && response.data.data) {
          setChatroomName(response.data.data.name);
        } else {
          setErrorChatroom(response.data.message || `Chatroom with ID ${chatroomId} not found.`);
          toast.error(response.data.message || `Chatroom with ID ${chatroomId} not found.`);
          setChatroomName('Error loading name');
        }
      } catch (err: any) {
        console.error(`Error fetching chatroom details for ${chatroomId}:`, err);
        setErrorChatroom('An error occurred while loading chatroom details.');
        toast.error('An error occurred while loading chatroom details.');
        setChatroomName('Error loading name');
      } finally {
        setLoadingChatroom(false);
      }
    };

    fetchChatroomDetails();
  }, [chatroomId]);

  const handleConnectRandom = () => {
    toast.info("Connecting with a random user (functionality not yet implemented)!");
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-grow flex pt-16">

        {/* Mobile Sidebar Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="md:hidden fixed top-20 left-4 z-40 p-2 rounded-md bg-card border border-border text-foreground shadow-md"
        >
          {isSidebarOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

        {/* Sidebar */}
        <aside
          className={`
            w-64 bg-card border-r border-border p-4 flex flex-col
            fixed top-0 left-0 h-full z-30 transform transition-transform duration-300 ease-in-out
            md:relative md:translate-x-0 md:flex md:top-auto md:h-auto md:z-auto
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <h2 className="text-xl font-semibold mb-4 mt-16 md:mt-0 text-primary">Users Online ({onlineUsers.length})</h2>

          {/* Connect Button */}
          <div className="mb-6">
            <button
              onClick={handleConnectRandom}
              className="bg-accent text-accent-foreground px-4 py-2 rounded-md font-semibold text-sm w-full
                         hover:bg-accent/90 transition-colors duration-300 shadow-sm
                         focus:outline-none focus:ring-2 focus:ring-accent focus:ring-opacity-50"
            >
              Connect with a random?
            </button>
          </div>

          <div className="space-y-3 overflow-y-auto flex-grow">
            {onlineUsers.length === 0 && !loadingChatroom ? (
                <p className="text-sm text-muted-foreground">No users online in this chatroom.</p>
            ) : (
                onlineUsers.map((user) => (
                    <div key={user.userId} className="flex items-center space-x-3">
                        <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-8 h-8 rounded-full object-cover border border-border"
                            referrerPolicy='no-referrer'
                        />
                        <span className="text-sm text-foreground">{user.name}</span>
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Online"></span>
                    </div>
                ))
            )}
          </div>
        </aside>

        {/* Overlay for mobile sidebar */}
        {isSidebarOpen && (
          <div
            onClick={toggleSidebar}
            className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          ></div>
        )}

        {/* Chat Area */}
        <section className="flex-grow flex flex-col bg-background p-4">
          {/* Dynamic Chatroom Name Header */}
          <h1 className="text-3xl font-bold mb-6 text-center text-primary">
            {loadingChatroom ? 'Loading Chatroom...' : errorChatroom ? 'Error' : `${chatroomName} Chatroom`}
          </h1>
          {errorChatroom && (
            <div className="text-error text-center mb-4 p-2 bg-red-900 bg-opacity-30 border border-error rounded-md">
              {errorChatroom}
            </div>
          )}

          <div className="flex-grow overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            {staticMessages.length === 0 ? (
                <p className="text-center text-muted-foreground mt-10">No messages yet. Start the conversation!</p>
            ) : (
                staticMessages.map((msg) => (
                    <div key={msg.id} className="flex items-start space-x-3">
                        <img
                            src={staticUsers.find(u => u.id === msg.userId)?.avatar || 'https://ui-avatars.com/api/?name=NA&background=random'}
                            alt={msg.userName}
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-border"
                        />
                        <div className="flex flex-col">
                            <div className="flex items-baseline space-x-2">
                                <span className="font-semibold text-primary">{msg.userName}</span>
                                <span className="text-xs text-muted-foreground">{msg.time}</span>
                            </div>
                            <p className="bg-secondary rounded-lg px-4 py-2 text-foreground break-words max-w-lg shadow-sm">
                                {msg.text}
                            </p>
                        </div>
                    </div>
                ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Area */}
          <div className="mt-4 flex items-center space-x-3 border-t border-border pt-4">
            <input
              type="text"
              placeholder="Type your message..."
              className="flex-grow p-3 rounded-lg bg-input border border-border text-foreground
                         focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              disabled={true}
            />
            <button
              className="bg-primary text-primary-foreground px-5 py-3 rounded-lg font-semibold
                         hover:bg-primary/90 transition-colors duration-300 disabled:opacity-50"
              disabled={true}
            >
              Send
            </button>
          </div>
        </section>
      </main>

      {/* Optional: Add a simple footer */}
      <footer className="p-4 text-center text-muted-foreground text-sm border-t border-border">
        &copy; {new Date().getFullYear()} Convofy.
      </footer>
    </div>
  );
};

export default ChatroomPage;

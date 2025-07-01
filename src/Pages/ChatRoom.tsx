// src/pages/ChatroomPage.tsx

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from './Sub-parts/NavigationBar'; // Assuming Navbar is fixed and has a height
import axios from 'axios';
import { toast } from 'sonner';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import Cookies from 'js-cookie';


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
// Aligned with the backend's ChatMessageResponseDTO
interface ChatMessageResponse {
  id: string; // Backend sends UUID as string
  userId: string;
  userName: string;
  userAvatar: string; // Backend provides a default if null, so it's always present
  text: string;
  time: string; // ISO string from backend
}

const ChatroomPage: React.FC = () => {
  const { chatroomId } = useParams<{ chatroomId: string }>();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [chatroomName, setChatroomName] = useState<string>('Loading Chatroom...');
  const [loadingChatroom, setLoadingChatroom] = useState(true);
  const [errorChatroom, setErrorChatroom] = useState<string | null>(null);

  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [messages, setMessages] = useState<ChatMessageResponse[]>([]); // State to hold dynamic chat messages
  const [newMessageText, setNewMessageText] = useState<string>(''); // State for the message input field

  const stompClient = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Retrieve the current logged-in user's ID from cookies
  // Provides a default 'Guest' if not found, but it's important for the login flow to set this cookie.
  const currentUserId = Cookies.get('userId');
  if(!currentUserId) {
    window.location.href = "/login";
  }
  // Helper function to retrieve JWT token from cookies
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

  // Effect to automatically scroll to the latest message
  // This runs whenever the 'messages' array changes (new message arrives or history is loaded)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Effect to fetch chat history when the component mounts or chatroomId/currentUserId changes
  useEffect(() => {
    const fetchChatHistory = async () => {
      if (!chatroomId) {
        // If no chatroomId, clear messages and return
        setMessages([]);
        return;
      }
      try {
        const jwtToken = getJwtToken();
        if (!jwtToken) {
          toast.error('Authentication required to fetch chat history.');
          setMessages([]);
          return;
        }

        // Make API call to fetch chat history using the optimized backend endpoint
        const response = await axios.get(`https://api.convofy.fun/api/chat/history/${chatroomId}?page=0&size=50`, {
          headers: {
            Authorization: `Bearer ${jwtToken}`, // Include JWT for authorization
          },
        });

        if (response.data.success && response.data.data) {
          // Reverse messages here if backend sends newest first for display oldest-to-newest
          setMessages(response.data.data.reverse()); // Reverse the array
          console.log('Chat history fetched:', response.data.data);
        } else {
          toast.error(response.data.message || 'Failed to fetch chat history. Please ensure your backend is running and the /api/chat/history/{chatroomId} endpoint is correctly implemented.', { duration: 5000 });
          setMessages([]); // Clear messages on error
        }
      } catch (err) {
        console.error('Error fetching chat history:', err);
        toast.error('An error occurred while fetching chat history. Please ensure your backend is running and the /api/chat/history/{chatroomId} endpoint is correctly implemented.', { duration: 5000 });
        setMessages([]); // Clear messages on error
      }
    };

    fetchChatHistory();
  }, [chatroomId, currentUserId]); // Dependency on chatroomId and currentUserId to re-fetch if they change

  // Effect for WebSocket connection and subscriptions
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

    // Initialize SockJS and STOMP client
    const socket = new SockJS('https://api.convofy.fun/ws');
    stompClient.current = Stomp.over(socket);

    const headers = {
      Authorization: `Bearer ${jwtToken}`, // Pass JWT for WebSocket authentication
    };

    // Connect to the WebSocket server
    stompClient.current.connect(headers, () => {
      console.log('Connected to WebSocket server!');

      // Send a message to the server to join the specific chatroom
      stompClient.current.send(
        `/app/chat.joinRoom`,
        headers,
        JSON.stringify({ chatroomId: chatroomId })
      );
      console.log(`Sent join room message for chatroom: ${chatroomId}`);

      // Subscribe to updates on online users for this chatroom
      stompClient.current.subscribe(`/topic/chatroom/${chatroomId}/onlineUsers`, (message: any) => {
        const receivedUsers: OnlineUser[] = JSON.parse(message.body);
        setOnlineUsers(receivedUsers);
        console.log('Received online users update:', receivedUsers);
      }, headers);

      // Subscribe to new chat messages for this chatroom
      stompClient.current.subscribe(`/topic/chatroom/${chatroomId}/messages`, (message: any) => {
        const receivedMessage: ChatMessageResponse = JSON.parse(message.body);
        console.log('Received new message:', receivedMessage);
        // Add the new message to the existing messages state
        setMessages((prevMessages) => [...prevMessages, receivedMessage]);
      }, headers);

    }, (error: any) => {
      // Handle WebSocket connection errors
      console.error('WebSocket connection error:', error);
      toast.error('Failed to connect to chat. Please try again.');
    });

    // Cleanup function for component unmount (React's lifecycle)
    // This ensures resources are properly released when the user leaves the page
    return () => {
      if (stompClient.current && stompClient.current.connected) {
        // Send leave room message before disconnecting
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
  }, [chatroomId]); // Re-run this effect if chatroomId changes

  // Effect to handle the 'beforeunload' event (when user navigates away or closes tab)
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Check if STOMP client is connected before attempting to send/disconnect
      if (stompClient.current && stompClient.current.connected) {
        const jwtToken = getJwtToken();
        const headers = { Authorization: `Bearer ${jwtToken}` };

        // Send leave room message to notify the server of disconnection
        stompClient.current.send(
          `/app/chat.leaveRoom`,
          headers,
          JSON.stringify({ chatroomId: chatroomId })
        );
        console.log(`Sent leave room message (on beforeunload) for chatroom: ${chatroomId}`);

        // Attempt to disconnect STOMP client (best effort in beforeunload)
        try {
          stompClient.current.disconnect(() => {
            console.log('Attempted disconnect on beforeunload.');
          }, 0); // 0 delay for immediate execution attempt
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


  // Effect to fetch the chatroom name (interest name)
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
        // Make API call to get interest details (chatroom name)
        const response = await axios.get(`https://api.convofy.fun/api/interests/${chatroomId}`);

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
  }, [chatroomId]); // Re-run effect if chatroomId changes

  // Handler for the "Connect with a random?" button (functionality still placeholder)
  const handleConnectRandom = () => {
    toast.info("Connecting with a random user (functionality not yet implemented)!");
  };

  // Handler to toggle sidebar visibility on mobile
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Handler to send a chat message
  const handleSendMessage = () => {
    if (newMessageText.trim() === '') {
      toast.info('Message cannot be empty!'); // Prevent sending empty messages
      return;
    }

    // Check if STOMP client is connected before attempting to send
    if (!stompClient.current || !stompClient.current.connected) {
      toast.error('Not connected to chat server. Please wait or refresh.');
      return;
    }

    const jwtToken = getJwtToken();
    const headers = { Authorization: `Bearer ${jwtToken}` };

    // Send the message via WebSocket to the designated sendMessage endpoint
    stompClient.current.send(
      `/app/chat.sendMessage`,
      headers,
      JSON.stringify({ chatroomId: chatroomId, content: newMessageText }) // Payload matches ClientMessageDTO
    );
    console.log(`Sent message: "${newMessageText}" to chatroom: ${chatroomId}`);
    setNewMessageText(''); // Clear the input field after sending
  };

  // Handler for keyboard presses in the message input (e.g., Enter key)
  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault(); // Prevent default form submission or other browser behavior
      handleSendMessage(); // Send message on Enter key press
    }
  };

  return (
    // Changed min-h-screen to h-screen and added overflow-hidden to the root div
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
      {/* Navbar component should be fixed and have a defined height, e.g., h-16 (64px) */}
      <Navbar />

      {/* Main content area: takes remaining vertical space, contains sidebar and chat */}
      {/* Removed pt-16 from main, as Navbar is assumed to be fixed above it. */}
      <main className="flex-grow flex min-h-0">

        {/* Mobile Sidebar Toggle Button */}
        {/* Adjusted top position to account for Navbar's height (assuming Navbar is h-16 = 64px + 1rem spacing) */}
        <button
          onClick={toggleSidebar}
          className="md:hidden fixed top-[calc(64px+1rem)] left-4 z-40 p-2 rounded-md bg-card border border-border text-foreground shadow-md"
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
            fixed left-0 z-30 transform transition-transform duration-300 ease-in-out
            md:relative md:translate-x-0 md:flex md:top-auto md:h-auto md:z-auto
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            // For mobile, sidebar starts below Navbar and takes remaining height
            h-[calc(100vh-64px)] top-16 // Navbar is assumed h-16 = 64px
          `}
        >
          {/* Adjusted mt to 0 as the sidebar's top is now correctly positioned below the Navbar */}
          <h2 className="text-xl font-semibold mb-4 mt-0 md:mt-0 text-primary">Users Online ({onlineUsers.length})</h2>

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
<h2 className="text-xl font-semibold mb-4 mt-0 md:mt-0 text-primary">Users Online ({onlineUsers.length})</h2>
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
        {/* Added overflow-hidden to section to strictly contain its content */}
        <section className="flex-grow flex flex-col bg-background p-4 min-h-0 overflow-hidden">
          {/* Dynamic Chatroom Name Header */}
          <h1 className="text-3xl font-bold mb-6 text-center text-primary">
            {loadingChatroom ? 'Loading Chatroom...' : errorChatroom ? 'Error' : `${chatroomName} Chatroom`}
          </h1>
          {errorChatroom && (
            <div className="text-error text-center mb-4 p-2 bg-red-900 bg-opacity-30 border border-error rounded-md">
              {errorChatroom}
            </div>
          )}

          {/* This is the key change: min-h-0 and flex-grow are crucial for scrolling */}
          <div className="flex-grow overflow-y-auto space-y-4 pr-2 custom-scrollbar min-h-0">
            {messages.length === 0 ? ( // Use dynamic 'messages' state here
                <p className="text-center text-muted-foreground mt-10">No messages yet. Start the conversation!</p>
            ) : (
                messages.map((msg) => {
                  const isOwnMessage = msg.userId === currentUserId; // Check if it's the current user's message
                  return (
                    <div
                      key={msg.id} // Use msg.id from the backend response
                      className={`flex items-start space-x-3 ${isOwnMessage ? 'justify-end' : 'justify-start'}`} // Align right for own messages
                    >
                      {/* Avatar and Name for others' messages */}
                      {!isOwnMessage && (
                        <img
                          src={msg.userAvatar || 'https://ui-avatars.com/api/?name=NA&background=random'} // Use msg.userAvatar from fetched data
                          alt={msg.userName}
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-border"
                          referrerPolicy='no-referrer'
                        />
                      )}

                      <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                        {/* Name and Time for others' messages, "You" and Time for own messages */}
                        <div className={`flex items-baseline space-x-2 ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                          {/* Format the timestamp from ISO string to a readable time */}
                          <span className="text-xs text-muted-foreground">
  {new Date(msg.time).toLocaleString([], {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })}
</span>
                          {!isOwnMessage ? (
                            <span className="font-semibold text-primary">{msg.userName}</span>
                          ) : (
                            <span className="font-semibold text-blue-500">You</span> // Differentiate "You"
                          )}
                        </div>
                        <p
                          className={`
                            rounded-lg px-4 py-2 text-foreground break-words max-w-lg shadow-sm
                            ${isOwnMessage ? 'bg-blue-600 text-white' : 'bg-secondary'}
                          `}
                        >
                          {msg.text}
                        </p>
                      </div>
                    </div>
                  );
                })
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
              value={newMessageText} // Bind value to state
              onChange={(e) => setNewMessageText(e.target.value)} // Update state on change
              onKeyDown={handleKeyPress} // Changed to onKeyDown
              // Disable input if WebSocket is not connected
              disabled={!stompClient.current?.connected || loadingChatroom}
            />
            <button
              className="bg-primary text-primary-foreground px-5 py-3 rounded-lg font-semibold
                          hover:bg-primary/90 transition-colors duration-300 disabled:opacity-50"
              onClick={handleSendMessage} // Call send message handler
              // Disable button if not connected, loading chatroom, or message is empty
              disabled={!stompClient.current?.connected || loadingChatroom || newMessageText.trim() === ''}
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

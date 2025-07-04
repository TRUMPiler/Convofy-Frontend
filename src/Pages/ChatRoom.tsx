import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from './Sub-parts/NavigationBar';
import axios from 'axios';
import { toast } from 'sonner';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import Cookies from 'js-cookie';
import UserProfileModal from '../Components/UserProfileModal';

interface Interest {
  interestId: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

interface OnlineUser {
  userId: string;
  name: string;
  email: string;
  avatar: string;
}

interface ChatMessageResponse {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  time: string;
}

const isImageOrGifUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') {
    return false;
  }
  const imageRegex = /\.(jpeg|jpg|png|gif|webp|bmp|svg)$/i;
  try {
    const parsedUrl = new URL(url);
    return imageRegex.test(parsedUrl.pathname) ||
           parsedUrl.hostname.includes('imgur.com') ||
           parsedUrl.hostname.includes('giphy.com') ||
           parsedUrl.hostname.includes('tenor.com');
  } catch (e) {
    return false;
  }
};

const ChatroomPage: React.FC = () => {
  const { chatroomId } = useParams<{ chatroomId: string }>();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chatroomName, setChatroomName] = useState<string>('Loading Chatroom...');
  const [loadingChatroom, setLoadingChatroom] = useState(true);
  const [errorChatroom, setErrorChatroom] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
  const [newMessageText, setNewMessageText] = useState<string>('');
  const stompClient = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageSoundRef = useRef<HTMLAudioElement | null>(null);

  const [selectedUser, setSelectedUser] = useState<OnlineUser | ChatMessageResponse | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const currentUserId = Cookies.get('userId');
  if (!currentUserId) {
    window.location.href = "/login";
  }

  const getJwtToken = () => {
    const name = 'jwtToken=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    console.log('onlineUsers state updated:', onlineUsers);
  }, [onlineUsers]);

  useEffect(() => {
    messageSoundRef.current = new Audio("../assets/message-sound.mp3");
  }, []);

  useEffect(() => {
    const fetchChatHistory = async () => {
      if (!chatroomId) {
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

        const response = await axios.get(`https://api.convofy.fun/api/chat/history/${chatroomId}?page=0&size=50`, {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        });

        if (response.data.success && response.data.data) {
          setMessages(response.data.data.reverse());
          console.log('Chat history fetched:', response.data.data);
        } else {
          toast.error(response.data.message || 'Failed to fetch chat history. Please ensure your backend is running and the /api/chat/history/{chatroomId} endpoint is correctly implemented.', { duration: 5000 });
          setMessages([]);
        }
      } catch (err) {
        console.error('Error fetching chat history:', err);
        toast.error('An error occurred while fetching chat history. Please ensure your backend is running and the /api/chat/history/{chatroomId} endpoint is correctly implemented.', { duration: 5000 });
        setMessages([]);
      }
    };

    fetchChatHistory();
  }, [chatroomId, currentUserId]);

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

    const socket = new SockJS('https://api.convofy.fun/ws');
    stompClient.current = Stomp.over(socket);

    const headers = {
      Authorization: `Bearer ${jwtToken}`,
    };

    stompClient.current.connect(headers, () => {
      console.log('Connected to WebSocket server!');

      stompClient.current.subscribe(`/topic/chatroom/${chatroomId}/onlineUsers`, (message: any) => {
        const receivedUsers: OnlineUser[] = JSON.parse(message.body);
        setOnlineUsers(receivedUsers);
        console.log('Received online users update:', receivedUsers);
      }, headers);

      stompClient.current.subscribe(`/topic/chatroom/${chatroomId}/messages`, (message: any) => {
        const receivedMessage: ChatMessageResponse = JSON.parse(message.body);
        setMessages((prevMessages) => {
          if (receivedMessage.userId !== currentUserId && messageSoundRef.current) {
            messageSoundRef.current.play().catch(e => console.error("Error playing sound:", e));
          }
          return [...prevMessages, receivedMessage];
        });
      }, headers);

      setTimeout(() => {
        stompClient.current.send(
          `/app/chat.joinRoom`,
          headers,
          JSON.stringify({ chatroomId: chatroomId })
        );
        console.log(`Sent join room message for chatroom: ${chatroomId} after delay.`);
      }, 100);

    }, (error: any) => {
      console.error('WebSocket connection error:', error);
      toast.error('Failed to connect to chat. Please try again.');
    });

    return () => {
      if (stompClient.current && stompClient.current.connected) {
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
  }, [chatroomId, currentUserId]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (stompClient.current && stompClient.current.connected) {
        const jwtToken = getJwtToken();
        const headers = { Authorization: `Bearer ${jwtToken}` };

        stompClient.current.send(
          `/app/chat.leaveRoom`,
          headers,
          JSON.stringify({ chatroomId: chatroomId })
        );
        console.log(`Sent leave room message (on beforeunload) for chatroom: ${chatroomId}`);

        try {
          stompClient.current.disconnect(() => {
            console.log('Attempted disconnect on beforeunload.');
          }, 0);
        } catch (e) {
          console.error("Error during STOMP disconnect on beforeunload:", e);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [chatroomId]);

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
  }, [chatroomId]);

  const handleConnectRandom = () => {
    toast.info("Connecting with a random user (functionality not yet implemented)!");
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const openProfileModal = (user: OnlineUser | ChatMessageResponse) => {
    setSelectedUser(user);
    setIsProfileModalOpen(true);
  };

  const closeProfileModal = () => {
    setSelectedUser(null);
    setIsProfileModalOpen(false);
  };

  const handleSendMessage = () => {
    if (newMessageText.trim() === '') {
      toast.info('Message cannot be empty!');
      return;
    }

    if (!stompClient.current || !stompClient.current.connected) {
      toast.error('Not connected to chat server. Please wait or refresh.');
      return;
    }

    const jwtToken = getJwtToken();
    const headers = { Authorization: `Bearer ${jwtToken}` };

    stompClient.current.send(
      `/app/chat.sendMessage`,
      headers,
      JSON.stringify({ chatroomId: chatroomId, content: newMessageText })
    );
    console.log(`Sent message: "${newMessageText}" to chatroom: ${chatroomId}`);
    setNewMessageText('');
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
      <Navbar />

      <main className="flex-grow flex min-h-0">
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

        <aside
          className={`
            w-64 bg-card border-r border-border p-4 flex flex-col
            fixed left-0 z-30 transform transition-transform duration-300 ease-in-out
            md:relative md:translate-x-0 md:flex md:top-auto md:h-auto md:z-auto
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            h-[calc(100vh-64px)] top-16
            overflow-y-auto
          `}
        >
          <h2 className="text-xl font-semibold mb-4 text-primary flex-shrink-0">Users Online ({onlineUsers.length})</h2>

          <div className="mb-6 flex-shrink-0">
            <button
              onClick={handleConnectRandom}
              className="bg-accent text-accent-foreground px-4 py-2 rounded-md font-semibold text-sm w-full
                          hover:bg-accent/90 transition-colors duration-300 shadow-sm
                          focus:outline-none focus:ring-2 focus:ring-accent focus:ring-opacity-50"
            >
              Connect with a random?
            </button>
          </div>
          <div className="space-y-3 flex-grow min-h-0">
            {onlineUsers.length === 0 && !loadingChatroom ? (
              <p className="text-sm text-muted-foreground">No users online in this chatroom.</p>
            ) : (
              onlineUsers.map((user) => (
                <div
                  key={user.userId}
                  className="flex items-center space-x-3 cursor-pointer hover:bg-secondary/50 rounded-md p-1 -ml-1 transition-colors duration-200"
                  onClick={() => openProfileModal(user)}
                >
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

        {isSidebarOpen && (
          <div
            onClick={toggleSidebar}
            className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          ></div>
        )}

        <section className="flex-grow flex flex-col bg-background p-4 min-h-0 overflow-hidden">
          <h1 className="text-3xl font-bold mb-6 text-center text-primary">
            {loadingChatroom ? 'Loading Chatroom...' : errorChatroom ? 'Error' : `${chatroomName} Chatroom`}
          </h1>
          {errorChatroom && (
            <div className="text-error text-center mb-4 p-2 bg-red-900 bg-opacity-30 border border-error rounded-md">
              {errorChatroom}
            </div>
          )}

          <div className="flex-grow overflow-y-auto space-y-4 pr-2 custom-scrollbar min-h-0">
            {messages.length === 0 ? (
              <p className="text-center text-muted-foreground mt-10">No messages yet. Start the conversation!</p>
            ) : (
              messages.map((msg) => {
                const isOwnMessage = msg.userId === currentUserId;
                const isMediaMessage = isImageOrGifUrl(msg.text);

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start space-x-3 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isOwnMessage && (
                      <img
                        src={msg.userAvatar || 'https://ui-avatars.com/api/?name=NA&background=random'}
                        alt={msg.userName}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-border cursor-pointer"
                        referrerPolicy='no-referrer'
                        onClick={() => openProfileModal(msg)}
                      />
                    )}

                    <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                      <div className={`flex items-baseline space-x-2 ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
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
                          <span
                            className="font-semibold text-primary cursor-pointer hover:underline"
                            onClick={() => openProfileModal(msg)}
                          >
                            {msg.userName}
                          </span>
                        ) : (
                          <span className="font-semibold text-blue-500">You</span>
                        )}
                      </div>
                      <div
                        className={`
                            rounded-lg px-4 py-2 text-foreground break-words max-w-lg shadow-sm
                            ${isOwnMessage ? 'bg-blue-600 text-white' : 'bg-secondary'}
                          `}
                      >
                        {isMediaMessage ? (
                          <a href={msg.text} target="_blank" rel="noopener noreferrer">
                            <img
                              src={msg.text}
                              alt="Shared content"
                              className="max-w-xs md:max-w-sm lg:max-w-md h-auto rounded-md object-cover cursor-pointer"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const parent = e.currentTarget.parentElement;
                                if (parent) {
                                  const textNode = document.createElement('span');
                                  textNode.textContent = msg.text;
                                  parent.appendChild(textNode);
                                }
                              }}
                            />
                          </a>
                        ) : (
                          <p>{msg.text}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="mt-4 flex items-center space-x-3 border-t border-border pt-4">
            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="fixed bottom-0 left-0 right-0 bg-background p-4 border-t border-border flex items-center space-x-3 z-50">
              <input
                type="text"
                placeholder="Type your message..."
                className="flex-grow p-3 rounded-lg bg-input border border-border text-foreground
                focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                disabled={!stompClient.current?.connected || loadingChatroom}
              />
              <button
                type="submit"
                className="bg-primary text-primary-foreground px-5 py-3 rounded-lg font-semibold
                hover:bg-primary/90 transition-colors duration-300 disabled:opacity-50"
                disabled={!stompClient.current?.connected || loadingChatroom || newMessageText.trim() === ''}
              >
                Send
              </button>
            </form>
          </div>
        </section>
      </main>

      <footer className="p-4 text-center text-muted-foreground text-sm border-t border-border">
        &copy; {new Date().getFullYear()} Convofy.
      </footer>

      {isProfileModalOpen && selectedUser && (
        <UserProfileModal
          user={selectedUser}
          onClose={closeProfileModal}
        />
      )}
    </div>
  );
};

export default ChatroomPage;
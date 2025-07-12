import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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

    const cleanedUrl = url.trim();

    if (!cleanedUrl.startsWith('http://') && !cleanedUrl.startsWith('https://')) {
        return false;
    }

    const imageRegex = /\.(jpeg|jpg|png|gif|webp|bmp|svg)$/i;

    try {
        const parsedUrl = new URL(cleanedUrl);
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
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [chatroomName, setChatroomName] = useState<string>('Loading Chatroom...');
    const [loadingChatroom, setLoadingChatroom] = useState(true);
    const [errorChatroom, setErrorChatroom] = useState<string | null>(null);
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
    const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
    const [newMessageText, setNewMessageText] = useState<string>('');
    const stompClient = useRef<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messageSound = useRef(new Audio('/message-sound.mp3'));
    const [audioUnlocked, setAudioUnlocked] = useState(false);
    const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);

    const [selectedUser, setSelectedUser] = useState<OnlineUser | ChatMessageResponse | null>(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    const [contextMenuVisible, setContextMenuVisible] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
    const [selectedMessageForContext, setSelectedMessageForContext] = useState<ChatMessageResponse | null>(null);
    const contextMenuRef = useRef<HTMLDivElement>(null);

    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const messageInputRef = useRef<HTMLInputElement>(null);

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

    const playMessageSound = () => {
        if (messageSound.current && audioUnlocked) {
            messageSound.current.currentTime = 0;
            messageSound.current.volume = 1;
            messageSound.current.play().catch(error => {
                console.error('Error playing sound:', error);
                if (error.name === 'NotSupportedError' || error.name === 'AbortError') {
                    console.warn('Audio playback prevented by browser autoplay policy. User interaction might be required to enable sound.');
                }
            });
        } else if (!audioUnlocked) {
            console.warn('Attempted to play sound before audio was unlocked by user interaction.');
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (editingMessageId && messageInputRef.current) {
            messageInputRef.current.focus();
        }
    }, [editingMessageId]);


    useEffect(() => {
        console.log('onlineUsers state updated:', onlineUsers);
    }, [onlineUsers]);

    useEffect(() => {
        const unlockAudio = () => {
            if (!audioUnlocked && messageSound.current) {
                messageSound.current.volume = 0;
                messageSound.current.play().then(() => {
                    setAudioUnlocked(true);
                    messageSound.current!.volume = 1;
                    console.log("Audio unlocked successfully!");
                }).catch(error => {
                    console.warn("Could not unlock audio automatically:", error);
                });
            }
            document.removeEventListener('click', unlockAudio);
            document.removeEventListener('keydown', unlockAudio);
        };

        document.addEventListener('click', unlockAudio);
        document.addEventListener('keydown', unlockAudio);

        return () => {
            document.removeEventListener('click', unlockAudio);
            document.removeEventListener('keydown', unlockAudio);
        };
    }, [audioUnlocked]);

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
                    setIsHistoryLoaded(true);
                } else {
                    toast.error('Failed to fetch chat history. Please ensure your backend is running and the /api/chat/history/{chatroomId} endpoint is correctly implemented.', { duration: 5000 });
                    setMessages([]);
                }
            } catch (err) {
                console.error('Error fetching chat history:', err);
                setMessages([]);
            }
        };

        fetchChatHistory();
    }, [chatroomId, currentUserId]);

    // Function to connect to WebSocket
    const connectWebSocket = useCallback(() => {
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

        // Deactivate existing client if active to prevent multiple connections
        if (stompClient.current && stompClient.current.connected) {
            console.log('Existing STOMP client is active, disconnecting before reconnect.');
            stompClient.current.disconnect(() => {
                console.log('Disconnected existing STOMP client.');
            });
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
                console.log('Received new message:', receivedMessage);
                setMessages((prevMessages) => {
                    const existingMessageIndex = prevMessages.findIndex(msg => msg.id === receivedMessage.id);

                    if (existingMessageIndex > -1) {
                        const updatedMessages = [...prevMessages];
                        updatedMessages[existingMessageIndex] = receivedMessage;
                        return updatedMessages;
                    } else {
                        if (isHistoryLoaded && receivedMessage.userId !== currentUserId) {
                            playMessageSound();
                        }
                        return [...prevMessages, receivedMessage];
                    }
                });
            }, headers);

            // Send join room message after a short delay to ensure subscriptions are active
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
    }, [chatroomId, currentUserId, audioUnlocked, isHistoryLoaded]); // Dependencies for connectWebSocket


    // Initial WebSocket connection on component mount
    useEffect(() => {
        connectWebSocket();

        // Cleanup on component unmount
        return () => {
            if (stompClient.current && stompClient.current.connected) {
                const jwtToken = getJwtToken();
                const headers = { Authorization: `Bearer ${jwtToken}` };
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
    }, [chatroomId, connectWebSocket]); // Re-run if chatroomId or connectWebSocket changes


    // Page Visibility API to handle app background/foreground on mobile
    useEffect(() => {
        const handleVisibilityChange = () => {
            const jwtToken = getJwtToken();
            const headers = { Authorization: `Bearer ${jwtToken}` };

            if (document.visibilityState === 'hidden') {
                // User is leaving the app/tab
                console.log('Page is hidden. Attempting to send leave message and disconnect WS.');
                if (stompClient.current && stompClient.current.connected) {
                    try {
                        stompClient.current.send(
                            `/app/chat.leaveRoom`,
                            headers,
                            JSON.stringify({ chatroomId: chatroomId })
                        );
                        console.log(`Sent leave room message (on hidden) for chatroom: ${chatroomId}`);
                        stompClient.current.disconnect(() => {
                            console.log('Disconnected from WebSocket server (on hidden).');
                        });
                    } catch (e) {
                        console.error("Error sending leave message or disconnecting on hidden:", e);
                    }
                }
            } else if (document.visibilityState === 'visible') {
                // User is returning to the app/tab
                console.log('Page is visible. Attempting to reconnect WS.');
                if (!stompClient.current || !stompClient.current.connected) {
                    connectWebSocket(); // Attempt to reconnect
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [chatroomId, connectWebSocket]);


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
                    toast.error(`Chatroom with ID ${chatroomId} not found.`, { duration: 5000 });
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

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
                setContextMenuVisible(false);
                setSelectedMessageForContext(null);
            }
        };

        if (contextMenuVisible) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [contextMenuVisible]);

    const handleConnectRandom = () => {
        if (chatroomId) {
            navigate(`/test/${chatroomId}`);
            toast.info("Connecting with a random user...");
        } else {
            toast.error("Cannot connect: Chatroom ID is missing.");
        }
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
        if (!newMessageText.trim() || !chatroomId || !stompClient.current || !stompClient.current.connected) {
            return;
        }

        const jwtToken = getJwtToken();
        if (!jwtToken) {
            toast.error('Authentication required to send messages.');
            return;
        }

        const headers = { Authorization: `Bearer ${jwtToken}` };

        if (editingMessageId) {
            const editMessagePayload = {
                chatroomId: chatroomId,
                messageId: editingMessageId,
                content: newMessageText.trim(),
            };
            stompClient.current.send(`/app/chat.editMessage`, headers, JSON.stringify(editMessagePayload));
            toast.success("Message updated!");
            setEditingMessageId(null);
        } else {
            const messagePayload = {
                chatroomId: chatroomId,
                content: newMessageText.trim(),
            };
            stompClient.current.send(`/app/chat.sendMessage`, headers, JSON.stringify(messagePayload));
        }

        setNewMessageText('');
    };

    const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleSendMessage();
        }
    };

    const showContextMenuForMessage = (event: React.MouseEvent | React.TouchEvent, message: ChatMessageResponse) => {
        event.preventDefault();

        let clientX, clientY;

        if (event.type === 'contextmenu') {
            if ('touches' in event) {
                clientX = event.touches[0].clientX;
                clientY = event.touches[0].clientY;
            } else {
                clientX = event.clientX;
                clientY = event.clientY;
            }
        } else {
            const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
            clientX = rect.right;
            clientY = rect.bottom;
        }

        setContextMenuVisible(true);
        setContextMenuPosition({ x: clientX, y: clientY });
        setSelectedMessageForContext(message);
    };

    const handleReplyMessage = () => {
        if (selectedMessageForContext) {
            toast.info(`Reply to message: "${selectedMessageForContext.text}"`);
        }
        setContextMenuVisible(false);
    };

    const handleEditMessage = () => {
        if (selectedMessageForContext) {
            let cleanedText = selectedMessageForContext.text;
            while (cleanedText.endsWith(" (1)")) {
                cleanedText = cleanedText.slice(0, -4);
            }
            setNewMessageText(cleanedText);
            setEditingMessageId(selectedMessageForContext.id);
            toast.info(`Editing message...`);
        }
        setContextMenuVisible(false);
    };

    const handleDeleteMessage = () => {
        if (selectedMessageForContext && chatroomId && stompClient.current && stompClient.current.connected) {
            const jwtToken = getJwtToken();
            if (!jwtToken) {
                toast.error('Authentication required to delete messages.');
                setContextMenuVisible(false);
                return;
            }

            const headers = { Authorization: `Bearer ${jwtToken}` };
            const deleteMessagePayload = {
                chatroomId: chatroomId,
                messageId: selectedMessageForContext.id,
            };

            stompClient.current.send(`/app/chat.deleteMessage`, headers, JSON.stringify(deleteMessagePayload));
            toast.success("Message deleted!");
        } else {
            toast.error("Failed to delete message.");
        }
        setContextMenuVisible(false);
    };

    const handleCopyText = () => {
        if (selectedMessageForContext) {
            let textToCopy = selectedMessageForContext.text;
            while (textToCopy.endsWith(" (1)")) {
                textToCopy = textToCopy.slice(0, -4);
            }
            const el = document.createElement('textarea');
            el.value = textToCopy;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            toast.success('Message copied to clipboard!');
        }
        setContextMenuVisible(false);
    };

    const handleReportMessage = () => {
        if (selectedMessageForContext) {
            toast.error(`Reporting message: "${selectedMessageForContext.text}"`);
        }
        setContextMenuVisible(false);
    };

    const handlePinMessage = () => {
        if (selectedMessageForContext) {
            toast.info(`Pin message: "${selectedMessageForContext.text}"`);
        }
        setContextMenuVisible(false);
    };

    const handleCancelEdit = () => {
        setNewMessageText('');
        setEditingMessageId(null);
        toast.info("Edit cancelled.");
    };

    if (loadingChatroom) {
        return <div className="flex justify-center items-center h-screen text-xl">Loading chatroom details...</div>;
    }

    if (errorChatroom) {
        return (
            <div className="flex justify-center items-center h-screen flex-col">
                <p className="text-xl text-red-500">{errorChatroom}</p>
                <button onClick={() => navigate('/dashboard')} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">Go to Dashboard</button>
            </div>
        );
    }

    return (
        <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
            <Navbar />

            <main className="flex-grow flex min-h-0 pt-24 md:pt-0">
                <button
                    onClick={toggleSidebar}
                    className={`md:hidden fixed top-28 left-4 z-40 p-2 rounded-md bg-card border border-border text-foreground shadow-md ${isSidebarOpen ? 'hidden' : ''}`}
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
                        top-24 h-[calc(100vh-10rem)] md:h-auto
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
                    <h1 className="text-3xl font-bold mb-2 text-center text-primary">
                        {loadingChatroom ? 'Loading Chatroom...' : errorChatroom ? 'Error' : `${chatroomName} Chatroom`}
                    </h1>
                    {!loadingChatroom && !errorChatroom && chatroomName && (
                        <div className="text-center text-lg text-muted-foreground font-medium mb-4">
                            Interest: <span className="text-accent-foreground">{chatroomName}</span>
                        </div>
                    )}

                    {errorChatroom && (
                        <div className="text-error text-center mb-4 p-2 bg-red-900 bg-opacity-30 border border-error rounded-md">
                            {errorChatroom}
                        </div>
                    )}

                    <div className="flex-grow overflow-y-auto space-y-4 pr-2 custom-scrollbar min-h-0 pb-24">
                        {messages.length === 0 ? (
                            <p className="text-center text-muted-foreground mt-10">No messages yet. Start the conversation!</p>
                        ) : (
                            messages.map((msg) => {
                                const isOwnMessage = msg.userId === currentUserId;

                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex items-start space-x-3 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                                        onContextMenu={(e) => showContextMenuForMessage(e, msg)}
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
                                                <button
                                                    className={`
                                                        ml-1 p-0.5 rounded-md text-muted-foreground hover:text-foreground
                                                        focus:outline-none focus:ring-2 focus:ring-ring
                                                        transition-opacity duration-200
                                                        block md:hidden
                                                    `}
                                                    onClick={(e) => showContextMenuForMessage(e, msg)}
                                                    aria-label="Message options"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <div
                                                className={`
                                                    rounded-lg px-4 py-2 text-foreground break-words max-w-lg shadow-sm select-none
                                                    ${isOwnMessage ? 'bg-blue-600 text-white' : 'bg-secondary'}
                                                `}
                                            >
                                                {(() => {
                                                    let contentToDisplay = msg.text;
                                                    let wasEdited = false;

                                                    while (contentToDisplay.endsWith(" (1)")) {
                                                        contentToDisplay = contentToDisplay.slice(0, -4);
                                                        wasEdited = true;
                                                    }

                                                    const isMedia = isImageOrGifUrl(contentToDisplay);

                                                    if (isMedia) {
                                                        return (
                                                            <>
                                                                <a href={contentToDisplay} target="_blank" rel="noopener noreferrer">
                                                                    <img
                                                                        src={contentToDisplay}
                                                                        alt="Shared content"
                                                                        className="max-w-xs md:max-w-sm lg:max-w-md h-auto rounded-md object-cover cursor-pointer"
                                                                        onError={(e) => {
                                                                            e.currentTarget.style.display = 'none';
                                                                            const parent = e.currentTarget.parentElement;
                                                                            if (parent) {
                                                                                const textNode = document.createElement('span');
                                                                                textNode.textContent = contentToDisplay;
                                                                                parent.appendChild(textNode);
                                                                            }
                                                                        }}
                                                                    />
                                                                </a>
                                                                {wasEdited && <span className="text-xs text-muted-foreground italic ml-1">(edited)</span>}
                                                            </>
                                                        );
                                                    } else {
                                                        return (
                                                            <p>
                                                                {contentToDisplay}
                                                                {wasEdited && <span className="text-xs text-muted-foreground italic ml-1">(edited)</span>}
                                                            </p>
                                                        );
                                                    }
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="mt-4 flex items-center space-x-3 border-t border-border pt-4">
                        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="fixed bottom-0 left-0 right-0 bg-background py-4 px-2 md:px-4 border-t border-border flex items-center space-x-1 md:space-x-3 z-50">
                            <input
                                ref={messageInputRef}
                                type="text"
                                placeholder={editingMessageId ? "Edit your message..." : "Type your message..."}
                                className="flex-grow p-3 rounded-lg bg-input border border-border text-foreground
                                focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                                value={newMessageText}
                                onChange={(e) => setNewMessageText(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            />
                            {editingMessageId && (
                                <button
                                    onClick={handleCancelEdit}
                                    className="px-2 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors duration-200 text-xs md:text-sm md:px-4 md:py-2"
                                >
                                    Cancel
                                </button>
                            )}
                            <button
                                type="submit"
                                className="bg-primary text-primary-foreground px-2 py-2 rounded-lg font-semibold
                                hover:bg-primary/90 transition-colors duration-300 disabled:opacity-50 text-xs md:text-sm md:px-5 md:py-3"
                                disabled={!stompClient.current?.connected || loadingChatroom || newMessageText.trim() === ''}
                            >
                                {editingMessageId ? 'Update' : 'Send'}
                            </button>
                        </form>
                    </div>
                </section>
            </main>

            <footer className="p-4 text-center text-muted-foreground text-sm border-t border-border mt-auto">
                &copy; {new Date().getFullYear()} Convofy.
            </footer>

            {isProfileModalOpen && selectedUser && (
                <UserProfileModal
                    user={selectedUser}
                    onClose={closeProfileModal}
                />
            )}

            {contextMenuVisible && selectedMessageForContext && (
                <div
                    ref={contextMenuRef}
                    className="absolute z-50 bg-card border border-border rounded-md shadow-lg py-1"
                    style={{ top: contextMenuPosition.y, left: contextMenuPosition.x }}
                >
                    <ul className="text-sm">
                        {selectedMessageForContext.userId === currentUserId && (
                            <>
                                {(selectedMessageForContext.text !== "[Message Deleted]" && selectedMessageForContext.text !== "[Message deleted]") && (
                                    <li
                                        className="px-4 py-2 hover:bg-secondary cursor-pointer"
                                        onClick={handleEditMessage}
                                    >
                                        Edit Message
                                    </li>
                                )}
                                {(selectedMessageForContext.text !== "[Message Deleted]" && selectedMessageForContext.text !== "[Message deleted]") && (
                                    <li
                                        className="px-4 py-2 hover:bg-secondary text-red-500 cursor-pointer"
                                        onClick={handleDeleteMessage}
                                    >
                                        Delete Message
                                    </li>
                                )}

                            </>
                        )}
                        <li
                            className="px-4 py-2 hover:bg-secondary cursor-pointer"
                            onClick={handleCopyText}
                        >
                            Copy Text
                        </li>
                        {selectedMessageForContext.userId !== currentUserId && (
                            <li
                                className="px-4 py-2 hover:bg-secondary cursor-pointer"
                                onClick={handleReportMessage}
                            >
                                Report Message
                            </li>
                        )}
                        {currentUserId === 'ADMIN_USER_ID' && (
                            <li
                                className="px-4 py-2 hover:bg-secondary cursor-pointer"
                                onClick={handlePinMessage}
                            >
                                Pin Message
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default ChatroomPage;

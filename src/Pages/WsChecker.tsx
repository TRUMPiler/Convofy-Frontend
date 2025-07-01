import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useEffect, useState } from "react";

type Message = {
  userId: string;
  message: string;
  meetId: string;
};

const WsChecker: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS("https://convofy-frontend-weld.vercel.app/ws"),
      debug: (str) => console.log(str),
      onConnect: () => {
        console.log("Connected to WebSocket server");

        // Subscribe to the desired topic
        client.subscribe("/queue/matches", (message) => {
          console.log("Received raw message:", message.body);

          try {
            const parsedMessage = JSON.parse(message.body) as Message;

            // Append the new message to the existing array
            setMessages((prevMessages) => [...prevMessages, parsedMessage]);
          } catch (error) {
            console.error("Failed to parse message:", error);
          }
        });
      },
      onDisconnect: () => console.log("Disconnected from WebSocket server"),
    });

    // Activate the WebSocket connection
    client.activate();

    // Cleanup on component unmount
    return () => {
      if (client.active) {
        client.deactivate();
      }
    };
  }, []);

  return (
    <div>
      <h1>Messages:</h1>
      <ul>
        {messages.map((msg, idx) => (
          <li key={idx}>
            <strong>User:</strong> {msg.userId}, <strong>Message:</strong> {msg.message}, <strong>Meet ID:</strong>{" "}
            {msg.meetId}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default WsChecker;

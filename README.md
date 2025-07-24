# Convofy: Real-Time Interest-Based Video & Text Chat

For backend visit [backend](https://github.com/TRUMPiler/Convofy-backend)

## 🚀 Overview
Convofy is a modern, real-time video conferencing and text chat application designed to connect users based on shared interests. It provides seamless, low-latency communication, allowing individuals to join dedicated chatrooms, engage in video calls, and exchange messages instantly. Built with a focus on a fluid user experience and robust backend infrastructure, Convofy aims to foster engaging interactions in a secure environment.

# ✨ Features
#### Interest-Based Chatrooms: Join or create chatrooms centered around specific interests, facilitating focused discussions and connections.

#### Real-Time Video Conferencing: High-quality video calls with multiple participants powered by VideoSDK.live.

#### Integrated Text Chat: Instant messaging functionality within each video meeting, allowing participants to communicate via text.

#### Dynamic Media Controls: Easily toggle microphone and webcam on/off during a call.

#### Responsive UI: A user interface that adapts seamlessly across various devices (desktop, tablet, mobile) for an optimal experience.

#### Secure Authentication: User login and session management secured with Google OAuth and JWT (JSON Web Tokens).

#### AI-Powered Chat Summarization (Planned/Future): Integration with Gemini API for intelligent summarization of chat conversations.

#### Real-time Notifications: Instant alerts for call events and chat messages.

# 🛠️ Technology Stack
Convofy is built using a powerful combination of frontend and backend technologies to ensure performance, scalability, and a rich user experience.

## Frontend
#### React: The core JavaScript library for building dynamic and interactive user interfaces.

#### VideoSDK.live React SDK (@videosdk.live/react-sdk): Provides the essential real-time video and audio capabilities, simplifying WebRTC complexities.

#### Tailwind CSS: A utility-first CSS framework for rapid and consistent UI styling, ensuring full responsiveness.

#### STOMP.js (@stomp/stompjs) & SockJS (sockjs-client): Libraries for robust WebSocket communication with the backend, enabling real-time chat and notifications.

#### Axios: A promise-based HTTP client for making API requests to the backend.

#### React Router DOM: Manages client-side routing for seamless navigation within the application.

#### JS-Cookie: A lightweight library for managing browser cookies, used for authentication tokens and user data.

#### Sonner: For elegant and accessible toast notifications, providing timely user feedback.

#### React Player (react-player): A versatile component for rendering video streams, ensuring proper aspect ratio handling (e.g., object-cover for portrait mobile videos).

## Backend
Spring Boot: The foundational framework for building the robust and scalable backend API and WebSocket server.

Spring Web: Provides RESTful API endpoints for managing call lifecycle events (e.g., starting and ending calls).

Spring Messaging (STOMP): Enables real-time, bi-directional communication over WebSockets for chat messages and call notifications.

PostgreSQL: (Assumed from typical Spring Boot projects, though not explicitly mentioned in provided snippets, it's common for data persistence). A powerful open-source relational database.

Google OAuth: For secure user authentication and authorization.

JWT (JSON Web Tokens): Used for secure, stateless authentication between the frontend and backend.

Gemini API (Planned/Future): For integrating advanced AI capabilities like chat summarization.

# 🏗️ Architecture Overview
Convofy follows a client-server architecture with a strong emphasis on real-time communication:

Client-Side (React App): Manages the user interface, handles user interactions, captures/renders media streams via VideoSDK.live, and communicates with the backend via both RESTful API calls (Axios) and persistent WebSocket connections (STOMP/SockJS).

Server-Side (Spring Boot App): Provides RESTful endpoints for business logic (e.g., call initiation/termination) and acts as a WebSocket broker for real-time chat and notifications. It processes messages, manages meeting states, and broadcasts updates to relevant clients.

Real-time Flow: When a user sends a chat message, the frontend publishes it to a specific STOMP destination. The Spring Boot controller receives this, processes it, and then broadcasts it to all clients subscribed to that meeting's chat topic, ensuring instant delivery. Call lifecycle events are also communicated via WebSockets.

# 🚀 Getting Started
To get Convofy up and running on your local machine, follow these steps:

Prerequisites
Node.js (LTS version recommended)

npm or Yarn

Java Development Kit (JDK 17 or higher)

Maven or Gradle (for backend build)

A VideoSDK.live account (for API keys)

A Google Cloud Project (for Google OAuth and Gemini API, if enabling)

A PostgreSQL database instance (if using for persistence)

Backend Setup
Clone the repository:

git clone https://github.com/TRUMPiler/convofy.git
cd convofy

Navigate to the backend directory:

cd backend # (Assuming your Spring Boot project is in a 'backend' folder)

Configure application.properties or application.yml:

Set up your database connection (PostgreSQL).

Configure VideoSDK.live API keys.

Configure Google OAuth credentials.

Set JWT secret and expiration.

Ensure WebSocket configurations (e.g., SockJS endpoint /ws) are correct.

Build and run the backend:

# Using Maven
mvn clean install
mvn spring-boot:run

# Or using Gradle
./gradlew bootJar
java -jar build/libs/your-app-name.jar

The backend should start on http://localhost:8080 (or your configured port).

Frontend Setup
Navigate to the frontend directory:

cd frontend # (Assuming your React project is in a 'frontend' folder)

Install dependencies:

npm install
 or
yarn install

Configure environment variables:

Create a .env file in the frontend root.

Add your backend API base URL (e.g., REACT_APP_API_BASE_URL=http://localhost:8080).

If using VideoSDK.live directly on frontend for some features, add relevant keys.

Run the frontend:

npm start
 or
yarn start

The frontend application should open in your browser, usually at http://localhost:3000.

# 💡 Usage
Access the Application: Open your browser and navigate to the frontend URL (e.g., http://localhost:3000).

Login: Use the Google OAuth integration to log in.

Join/Create Chatroom: Navigate to the interest-based chatroom section (e.g., /test/{interestId}).

Start/Join Call: Initiate or join a video call within the chatroom.

Interact: Use the on-screen controls for mic/webcam, and the integrated chat panel for text communication.

# 🤝 Contributing
Contributions are welcome! If you have suggestions for improvements or find any bugs, please feel free to:

Fork the repository.

Create a new branch (git checkout -b feature/YourFeature).

Make your changes.

Commit your changes (git commit -m 'Add new feature').

Push to the branch (git push origin feature/YourFeature).

Open a Pull Request.



# 📧 Contact
For any questions or inquiries, please open an issue on the GitHub repository or contact naishal036@gmail.com

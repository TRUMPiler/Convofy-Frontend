import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from './Sub-parts/NavigationBar'; // Assuming you have a Navbar component

const features = [
  {
    title: "Real-time Chat",
    description: "Connect instantly with like-minded individuals in various interest-based chatrooms. Share text, images, and express yourself freely!",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-500 mb-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
    image: "https://placehold.co/600x400/3b82f6/ffffff?text=Chat+Feature" // Placeholder image
  },
  {
    title: "Seamless Video Calls",
    description: "Go beyond text! Engage in high-quality video calls with your connections, making interactions more personal and engaging.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500 mb-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14m-5 3H7a2 2 0 01-2-2V9a2 2 0 012-2h3a2 2 0 012 2v6a2 2 0 01-2 2z" />
      </svg>
    ),
    image: "https://placehold.co/600x400/22c55e/ffffff?text=Video+Call" // Placeholder image
  },
  {
    title: "Find Your Community",
    description: "Discover chatrooms based on your interests. From hobbies to professional topics, there's a place for everyone.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-purple-500 mb-4" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28c-.11.145-.22.29-.33.435-.357.427-.608.834-.736 1.157a.75.75 0 01-.585.585c-.323.128-.73.379-1.157.736-.145.11-.29.22-.435.33A8.25 8.25 0 012.25 10.5z" clipRule="evenodd" />
        <path d="M15.75 12a.75.75 0 01.75-.75h.75a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75h-.75a.75.75 0 01-.75-.75z" />
      </svg>
    ),
    image: "https://placehold.co/600x400/8b5cf6/ffffff?text=Community" // Placeholder image
  }
];

const Dashboard: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    // Auto-advance carousel every 5 seconds
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % features.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const goToNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % features.length);
  };

  const goToPrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + features.length) % features.length);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-96 flex items-center justify-center text-center bg-gradient-to-r from-blue-700 to-purple-700 shadow-xl overflow-hidden">
        <div className="absolute inset-0 bg-pattern opacity-10"></div> {/* Optional background pattern */}
        <div className="relative z-10 p-6 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 leading-tight animate-fade-in-up">
            Connect. Chat. Converse.
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-8 animate-fade-in-up delay-200">
            Your platform for meaningful conversations and real-time connections.
          </p>
          <Link
            to="/dashboard" // Link to your actual chatroom list/dashboard
            className="inline-block px-8 py-3 bg-white text-blue-700 font-bold rounded-full shadow-lg
                       hover:bg-gray-100 transform hover:scale-105 transition-all duration-300 ease-in-out
                       animate-fade-in-up delay-400"
          >
            Explore Chatrooms
          </Link>
        </div>
      </section>

      {/* Features Carousel Section */}
      <section className="py-16 bg-gray-800">
        <h2 className="text-4xl font-bold text-center mb-12 text-primary-foreground">Key Features</h2>
        <div className="relative max-w-4xl mx-auto px-4">
          {/* Carousel Container */}
          <div className="relative overflow-hidden rounded-xl shadow-2xl bg-gray-700">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out flex flex-col md:flex-row items-center p-8
                            ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
              >
                <div className="md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left p-4">
                  {feature.icon}
                  <h3 className="text-3xl font-bold mb-3 text-white">{feature.title}</h3>
                  <p className="text-lg text-gray-300">{feature.description}</p>
                </div>
                <div className="md:w-1/2 p-4 flex justify-center items-center">
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="w-full h-auto max-h-80 object-cover rounded-lg shadow-lg"
                    onError={(e) => { e.currentTarget.src = `https://placehold.co/600x400/4a5568/ffffff?text=Feature+Image`; }}
                  />
                </div>
              </div>
            ))}

            {/* Carousel Navigation Buttons */}
            <button
              onClick={goToPrevSlide}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full z-20 hover:bg-opacity-75 transition-colors"
              aria-label="Previous slide"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToNextSlide}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full z-20 hover:bg-opacity-75 transition-colors"
              aria-label="Next slide"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Carousel Indicators */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
              {features.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full ${index === currentSlide ? 'bg-white' : 'bg-gray-400'} transition-colors duration-300`}
                  aria-label={`Go to slide ${index + 1}`}
                ></button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How to Make Friends Section */}
      <section className="py-16 bg-gray-900 text-center px-4">
        <h2 className="text-4xl font-bold mb-8 text-primary-foreground">How to Make Friends on Convofy</h2>
        <div className="max-w-3xl mx-auto text-lg text-gray-300 space-y-6">
          <p>
            Making new connections on Convofy is easy and fun! Here's a simple guide:
          </p>
          <ol className="list-decimal list-inside text-left mx-auto max-w-md space-y-2">
            <li>
              **Explore Interests:** Navigate to the "Chatrooms" section (or your main chat list). You'll find various chatrooms categorized by different interests. Choose one that resonates with you!
            </li>
            <li>
              **Join a Chatroom:** Click on a chatroom to enter. You'll see a list of online users currently active in that room.
            </li>
            <li>
              **Start Chatting:** Introduce yourself, respond to ongoing conversations, or ask questions related to the chatroom's interest. Be friendly and engaging!
            </li>
            <li>
              **Connect Randomly (Optional):** In some chatrooms, you might find a "Connect with a random?" button. This allows you to instantly start a private chat or even a video call with another user seeking a random connection.
            </li>
            <li>
              **Initiate Video Calls:** Once you've had a good conversation in chat, you can smoothly transition to a video call for a more personal interaction (if both parties are comfortable).
            </li>
            <li>
              **Be Respectful:** Always maintain a positive and respectful attitude. Good conversations lead to great friendships!
            </li>
          </ol>
          <p className="mt-8 text-xl font-semibold text-blue-400">
            Happy connecting!
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="p-6 bg-gray-800 text-center text-gray-400 text-sm border-t border-gray-700 mt-auto">
        Made with Love by Naisal Doshi ❤️
      </footer>
    </div>
  );
};

export default Dashboard;

import React from 'react';
import Navbar from './Sub-parts/NavigationBar'; // Adjust path if necessary

const AboutUsPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <Navbar />
            <main className="flex-grow container mx-auto p-8 pt-24 md:pt-16"> {/* Adjust padding-top to account for fixed Navbar */}
                <h1 className="text-4xl font-bold text-primary mb-6 text-center">About Convofy</h1>

                <section className="bg-card p-6 rounded-lg shadow-lg mb-8">
                    <h2 className="text-2xl font-semibold text-accent-foreground mb-4">Our Mission</h2>
                    <p className="text-lg leading-relaxed mb-4">
                        At Convofy, our mission is to foster **meaningful connections** through instant, topic-based conversations. We believe that everyone deserves a space to connect with like-minded individuals, share ideas, and engage in genuine dialogue without the pressure of long-term commitments or social media facades. We're building a platform where curiosity leads to conversation, and every interaction enriches your day.
                    </p>
                    <p className="text-lg leading-relaxed">
                        Whether you're looking to discuss a niche interest, find a study partner, or simply chat with someone new, Convofy connects you to the right people at the right time.
                    </p>
                </section>

                <section className="bg-card p-6 rounded-lg shadow-lg mb-8">
                    <h2 className="text-2xl font-semibold text-accent-foreground mb-4">What We Offer</h2>
                    <ul className="list-disc list-inside space-y-2 text-lg">
                        <li>**Instant Connections:** Get matched with users interested in the same topics in real-time.</li>
                        <li>**Topic-Based Chatrooms:** Dive into conversations centered around specific interests, hobbies, or subjects.</li>
                        <li>**Anonymous & Safe:** Chat freely without revealing personal information unless you choose to. Your privacy is our priority.</li>
                        <li>**Seamless Experience:** A clean, intuitive interface designed for easy navigation and enjoyable conversations.</li>
                    </ul>
                </section>

                <section className="bg-card p-6 rounded-lg shadow-lg mb-8">
                    <h2 className="text-2xl font-semibold text-accent-foreground mb-4">Our Vision</h2>
                    <p className="text-lg leading-relaxed">
                        We envision a world where connecting with others is effortless, authentic, and universally accessible. Convofy aims to be the go-to platform for spontaneous, insightful, and diverse conversations that broaden perspectives and build a global community of curious minds.
                    </p>
                </section>

               
                <section className="bg-card p-6 rounded-lg shadow-lg mb-8">
                    <h2 className="text-2xl font-semibold text-accent-foreground mb-4 text-center">About the Developer</h2>
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                        <div className="flex-shrink-0">
                            <img
                                src="https://lh3.googleusercontent.com/a/ACg8ocIfJfW7Wlzd6Wy_8nAg9nZ705Lfj5xlVrKgPOBI5GDO9M77SNus=s96-c" // Placeholder image
                                alt="Naisal Doshi"
                                className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover shadow-md border-4 border-primary"
                                referrerPolicy='no-referrer'
                            />
                        </div>
                        <div className="text-center md:text-left flex-grow">
                            <h3 className="text-xl font-bold text-primary mb-2">Naisal Doshi</h3>
                            <p className="text-lg leading-relaxed mb-4">
                                The primary motivation behind Convofy stems from a personal realization: the challenge of consistently engaging in meaningful conversations about shared passions within existing social circles. It can be frustrating when your immediate connections don't always align with your current interests. Convofy was born from the desire to overcome this conversational void, creating a dedicated space where individuals can effortlessly discover and connect with others who share their specific curiosities and topics of interest. It's about ensuring that the 'pot' of engaging dialogue remains perpetually 'filled,' fostering deeper connections and enriching intellectual exchange.
                            </p>
                            <div className="flex justify-center md:justify-start space-x-4 mt-4">
                                <a
                                    href="https://github.com/TRUMPiler"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:text-accent-foreground transition-colors duration-300 flex items-center gap-1"
                                >
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.499.09.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.529 2.341 1.088 2.91.829.091-.645.359-1.088.659-1.338-2.22-.253-4.555-1.113-4.555-4.953 0-1.091.39-1.984 1.029-2.682-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.702.114 2.503.385 1.902-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.099 2.65.64.698 1.028 1.591 1.028 2.682 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.183.592.687.483C21.133 20.28 24 16.513 24 12.017 24 6.484 19.522 2 12 2Z" clipRule="evenodd" />
                                    </svg>
                                    GitHub
                                </a>
                                <a
                                    href="https://www.linkedin.com/in/your-linkedin-profile" // Replace with actual LinkedIn profile
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:text-accent-foreground transition-colors duration-300 flex items-center gap-1"
                                >
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path d="M20.447 20.452h-3.554v-5.564c0-1.303-.022-2.983-1.812-2.983-1.816 0-2.094 1.413-2.094 2.886v5.661H9.351V9.216h3.413v1.561h.048c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.27Z M5.013 7.337a2.395 2.395 0 0 1-2.403-2.398c0-1.326 1.073-2.398 2.403-2.398s2.403 1.072 2.403 2.398c0 1.326-1.073 2.398-2.403 2.398Z M6.847 20.452H3.166V9.216h3.681v11.236Z" />
                                    </svg>
                                    LinkedIn
                                </a>
                                <a
                                    href="https://www.instagram.com/your-instagram-profile" // Replace with actual Instagram profile
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:text-accent-foreground transition-colors duration-300 flex items-center gap-1"
                                >
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path d="M12 0C8.74 0 8.333.014 7.053.072 5.775.132 4.905.333 4.14.636c-.789.306-1.459.71-2.126 1.377-.667.666-1.071 1.337-1.377 2.126C.333 4.905.132 5.775.072 7.053.014 8.333 0 8.74 0 12s.014 3.667.072 4.947c.06 1.277.261 2.147.564 2.913.306.789.71 1.459 1.377 2.126.666.667 1.337 1.071 2.126 1.377.766.303 1.636.504 2.913.564C8.333 23.986 8.74 24 12 24s3.667-.014 4.947-.072c1.277-.06 2.147-.261 2.913-.564.789-.306 1.459-.71 2.126-1.377.667-.666 1.071-1.337 1.377-2.126.303-.766.504-1.636.564-2.913.058-1.28.072-1.687.072-4.947s-.014-3.667-.072-4.947c-.06-1.277-.261-2.147-.564-2.913-.306-.789-.71-1.459-1.377-2.126C21.337.71 20.666.306 19.878.072 18.6.014 18.193 0 12 0Zm0 2.163c3.2 0 3.58.012 4.85.071 1.17.055 1.8.249 2.222.412.56.216.96.479 1.38.899.42.42.683.82.899 1.38.163.42.357 1.052.412 2.222.059 1.27.071 1.65.071 4.85s-.012 3.58-.071 4.85c-.055 1.17-.249 1.8-.412 2.222-.216.56-.479.96-.899 1.38-.42.42-.82.683-1.38.899-.42.163-1.052.357-2.222.412-1.27.059-1.65.071-4.85.071s-3.58-.012-4.85-.071c-1.17-.055-1.8-.249-2.222-.412-.56-.216-.96-.479-1.38-.899-.42-.42-.683-.82-.899-1.38-.163-.42-.357-1.052-.412-2.222-.059-1.27-.071-1.65-.071-4.85s.012-3.58.071-4.85c.055-1.17.249-1.8.412-2.222.216-.56.479-.96.899-1.38.42-.42.82-.683 1.38-.899.42-.163 1.052-.357 2.222-.412 1.27-.059 1.65-.071 4.85-.071ZM12 7.763c-2.343 0-4.237 1.894-4.237 4.237S9.657 16.237 12 16.237s4.237-1.894 4.237-4.237S14.343 7.763 12 7.763Zm0 6.907c-1.474 0-2.67-1.196-2.67-2.67s1.196-2.67 2.67-2.67 2.67 1.196 2.67 2.67-1.196 2.67-2.67 2.67ZM18.572 5.023a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Z" />
                                    </svg>
                                    Instagram
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-card p-6 rounded-lg shadow-lg">
                    <h2 className="text-2xl font-semibold text-accent-foreground mb-4">Join Our Community</h2>
                    <p className="text-lg leading-relaxed mb-4">
                        Ready to start conversing? Join Convofy today and discover a new way to connect. We're constantly evolving and improving, and your feedback is invaluable to us.
                    </p>
                    <div className="text-center">
                        <a
                            href="/dashboard"
                            className="inline-block bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold text-xl
                                       hover:bg-primary/90 transition-colors duration-300 shadow-md"
                        >
                            Start Your Conversation!
                        </a>
                    </div>
                </section>
            </main>

            <footer className="p-4 text-center text-muted-foreground text-sm border-t border-border mt-auto">
                &copy; {new Date().getFullYear()} Convofy.
            </footer>
        </div>
    );
};

export default AboutUsPage;

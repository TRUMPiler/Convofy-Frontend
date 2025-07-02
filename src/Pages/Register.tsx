import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import GoogleRegisterButton from "./Sub-parts/GoogleRegisterButton"; // Import the GoogleRegisterButton component
import Navbar from "./Sub-parts/NavigationBar";
import Cookies from "js-cookie";

const RegistrationPage: React.FC = () => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
        image: "", // This field isn't used in the backend /api/users endpoint for now, but kept for consistency
    });
    
    const headtowardLogin = () => {
        window.location.href = "./login";
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        const { name, email, password, confirmPassword, phone, image } = formData; // Include image in destructuring

        if (password !== confirmPassword) {
            toast.error("Passwords do not match!", { className: "error" });
            return;
        }

        try {
            const response = await axios.post(
                "https://api.convofy.fun/api/users",
                { name, email, password, phone, image }, // Send image if you want it to be part of registration
                { headers: { "Content-Type": "application/json" } }
            );

            console.log("Registration Response Data:", response.data);

            if (response.data.success && response.data.data) {
                const { jwt, userId, name: userName, email: userEmail, image: userImage } = response.data.data;

                // Store JWT in a cookie
                Cookies.set('jwtToken', jwt, { expires: 1/2 }); // Expires in 12 hours (1/2 day)
                Cookies.set('userId', userId.toString());
                Cookies.set('name', userName || name); // Use name from backend response, fallback to form data
                Cookies.set('email', userEmail || email); // Use email from backend response, fallback to form data
                Cookies.set('avatar', userImage ?? 'https://github.com/shadcn.png'); // Use image from backend, fallback to default

                toast.success("Registration Successful! Welcome to the platform.", {
                    className: "success",
                });
                
                setTimeout(() => {
                    window.location.href = '/';
                }, 1500);
            } else {
                toast.error(response.data.message ?? "Registration failed.", {
                    className: "error",
                });
            }
        } catch (error: any) {
            console.error("Registration error:", error);
            if (error.response && error.response.status === 409) {
                toast.error("Email already exists. Please use a different email.", {
                    className: "error",
                });
                // No immediate redirect to login here, user might want to try another email
            } else {
                toast.error("An error occurred during registration. Please try again.", {
                    className: "error",
                });
            }
        }
    };

    return (
        <>
            <Navbar />
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
                <h1 className="text-2xl font-bold mb-6">Register</h1>

                <form
                    className="w-full max-w-md bg-white p-6 rounded shadow-md"
                    onSubmit={handleRegister}
                >
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-1">Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border rounded"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border rounded"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border rounded"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-1">Confirm Password</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border rounded"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-1">Phone</label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border rounded"
                        />
                    </div>
                    {/* Optional: Add an input for image URL if you want users to set it during registration */}
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-1">Profile Image URL (Optional)</label>
                        <input
                            type="url"
                            name="image"
                            value={formData.image}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border rounded"
                            placeholder="e.g., https://example.com/your-pic.jpg"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Register
                    </button>

                    <div className="flex justify-center items-center my-4">
                        <span className="text-sm text-gray-500">or</span>
                    </div>
                    <button
                        className="w-full py-2 bg-blue-600 text-white rounded shadow "
                        onClick={headtowardLogin}
                    >
                        Login?
                    </button>
                </form>

                <div className="my-4">
                    <p className="text-gray-600">Or Register Using Google</p>
                    <GoogleRegisterButton />
                </div>
            </div>
        </>
    );
};

export default RegistrationPage;

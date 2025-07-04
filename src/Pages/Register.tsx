import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import GoogleRegisterButton from "./Sub-parts/GoogleRegisterButton";
import Navbar from "./Sub-parts/NavigationBar";
import Cookies from "js-cookie";

const RegistrationPage: React.FC = () => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
        image: "",
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
        const { name, email, password, confirmPassword, phone, image } = formData;

        if (password !== confirmPassword) {
            toast.error("Passwords do not match!", { className: "error" });
            return;
        }

        try {
            const response = await axios.post(
                "https://api.convofy.fun/api/users",
                { name, email, password, phone, image },
                { headers: { "Content-Type": "application/json" } }
            );

            console.log("Registration Response Data:", response.data);

            if (response.data.success && response.data.data) {
                const { jwt, userId, name: userName, email: userEmail, image: userImage } = response.data.data;

                Cookies.set('jwtToken', jwt, { expires: 1/2 });
                Cookies.set('userId', userId.toString());
                Cookies.set('name', userName || name);
                Cookies.set('email', userEmail || email);
                Cookies.set('avatar', userImage ?? 'https://github.com/shadcn.png');

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
            if (axios.isAxiosError(error) && error.response && error.response.status === 409) {
                toast.error("Email already exists. Please use a different email.", {
                    className: "error",
                });
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
                <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-lg">
                    <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Create Your Account</h1>

                    <form onSubmit={handleRegister}>
                        <div className="mb-4">
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                required
                            />
                        </div>
                        <div className="mb-6">
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone (Optional)</label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                placeholder="e.g., +1234567890"
                            />
                        </div>
                        <div className="mb-6">
                            <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">Profile Image URL (Optional)</label>
                            <input
                                type="url"
                                id="image"
                                name="image"
                                value={formData.image}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                placeholder="e.g., https://example.com/your-pic.jpg"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            Register
                        </button>
                    </form>

                    <div className="flex items-center my-6">
                        <div className="flex-grow border-t border-gray-300"></div>
                        <span className="flex-shrink mx-4 text-gray-500 text-sm">or</span>
                        <div className="flex-grow border-t border-gray-300"></div>
                    </div>

                    <div className="mb-6">
                        <p className="text-center text-gray-600 mb-3">Continue with Google</p>
                        <GoogleRegisterButton />
                    </div>

                    <div className="text-center mt-6">
                        <p className="text-gray-700 mb-2">Already have an account?</p>
                        <button
                            className="w-full py-2 bg-white text-blue-600 border border-blue-600 rounded-md shadow-sm hover:bg-blue-50 hover:border-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            onClick={headtowardLogin}
                        >
                            Log In
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default RegistrationPage;

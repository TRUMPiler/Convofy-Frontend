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
        const { name, email, password, confirmPassword, phone } = formData;

        if (password !== confirmPassword) {
            toast.error("Passwords do not match!", { className: "error" });
            return;
        }

        try {
            const response = await axios.post(
                "http://localhost:8080/api/users",
                { name, email, password, phone },
                { headers: { "Content-Type": "application/json" } }
            );
            if (response.status == 409) {
                toast.error("Email already exists. Please use a different email.", {
                    className: "error",
                });
            }
            if (response.data.success) {
                toast.success("Registration Successful! Welcome to the platform.", {
                    className: "success",
                });
                Cookies.set('userId', response.data.data.userid.toString());
                Cookies.set('name', name);
                Cookies.set('email', email);
                
                setTimeout(() => {
                    window.location.href = '/';
                }, 1500);
                // Additional actions like setting cookies, redirecting, etc.
            } else {
                toast.error(response.data.message ?? "Registration failed.", {
                    className: "error",
                });
            }
        } catch (error: any) {

            if (error.response.status == 409) {
                toast.error("Email already exists. Please use a different email.", {
                    className: "error",
                });
                setTimeout(() => {
                    window.location.href = '/login';
                }, 1500);
            }
            else {
                toast.error("An error occurred during registration. Please try again.", {
                    className: "error",
                });
                console.error("Registration error:", error);
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

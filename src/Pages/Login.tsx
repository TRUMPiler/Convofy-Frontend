import React, { useState } from 'react';
import GoogleLoginButton from './Sub-parts/GoogleLoginButton'; // Import the Google login button
import axios from 'axios';
import { toast } from 'sonner';
import Cookies from 'js-cookie';
import Navbar from './Sub-parts/NavigationBar';
const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const headtowardRegister = () => {
        window.location.href = './register';
    }
    const handleLogin = async () => {
        try {
            setLoading(true);
            const response = await axios.post(
                'http://localhost:8080/api/users/login',
                { email, password },
                { headers: { 'Content-Type': 'application/json' } }     
            );
            console.log(response.data); 
            if (response.data.success) {
                toast('Login Successful! Welcome back!', { className: 'success' });
                toast.success('Login Successful! Welcome back!', { className: 'success' });
                Cookies.set('userId', response.data.data.userid.toString());
                Cookies.set('name', response.data.data.name.toString());
                Cookies.set('email', response.data.data.email.toString());
                Cookies.set('avatar', response.data.data.image ?? 'https://github.com/shadcn.png');
                setTimeout(() => {
                    window.location.href = './';
                }, 1500);
                console.log(response.data);
            } else {
                toast.error('Invalid email or password. Please try again.', { className: 'error' });
            }
        } catch (error: any) {
            console.log(error);
            if(error.response.status==401&& error.response.status!=null){toast.error('Invalid email or password. Please try again.', { className: 'error' });}
            else{
            console.error('Error during login:', error);
            toast.error('An error occurred. Please try again later.', { className: 'error' });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Navbar />
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
                <div className="bg-white rounded shadow-lg p-6 w-full max-w-sm">
                    <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>

                    {/* Standard Login Form */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            className="mt-1 p-2 w-full border rounded"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            className="mt-1 p-2 w-full border rounded"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button
                        className="w-full py-2 bg-blue-600 text-white rounded shadow"
                        onClick={handleLogin}
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>

                    <div className="flex justify-center items-center my-4">
                        <span className="text-sm text-gray-500">or</span>
                    </div>

                    {/* Google Login */}
                    <GoogleLoginButton />
                    <div className="flex justify-center items-center my-4">
                   <button
                        className="w-full py-2 bg-blue-600 text-white rounded shadow"
                        onClick={headtowardRegister}
                        
                    >
                        Register
                    </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default LoginPage;

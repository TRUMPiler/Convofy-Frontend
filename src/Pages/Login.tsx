import React, { useState } from 'react';
import GoogleLoginButton from './Sub-parts/GoogleLoginButton';
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
                'https://api.convofy.fun/api/users/login',
                { email, password },
                { headers: { 'Content-Type': 'application/json' } }    
            );
            
            console.log("Login Response Data:", response.data); 

            if (response.data.success && response.data.data) {
                const { jwt, userId, name, email: userEmail, image } = response.data.data;

                Cookies.set('jwtToken', jwt, { expires: 1/2 });
                Cookies.set('userId', userId.toString());
                Cookies.set('name', name.toString());
                Cookies.set('email', userEmail.toString());
                Cookies.set('avatar', image ?? 'https://github.com/shadcn.png');

                toast.success('Login Successful! Welcome back!', { className: 'success' });
                
                setTimeout(() => {
                    window.location.href = './';
                }, 1500);
            } else {
                toast.error(response.data.message || 'Invalid email or password. Please try again.', { className: 'error' });
            }
        } catch (error: any) {
            console.error('Error during login:', error);
            if (axios.isAxiosError(error) && error.response && error.response.status === 401) {
                toast.error('Invalid email or password. Please try again.', { className: 'error' });
            } else {
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
                        className="w-full py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition-colors duration-200"
                        onClick={handleLogin}
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>

                    <div className="flex justify-center items-center my-4">
                        <span className="text-sm text-gray-500">or</span>
                    </div>
                    
                    <GoogleLoginButton />

                    {/* New and improved registration section */}
                    <div className="mt-6 text-center">
                        <p className="text-base text-gray-700 mb-3 font-semibold">
                            New to Convofy?
                        </p>
                        <button
                            className="w-full py-2 bg-green-500 text-white rounded shadow hover:bg-green-600 transition-colors duration-200 transform hover:scale-105"
                            onClick={headtowardRegister}
                        >
                            Create an Account
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default LoginPage;

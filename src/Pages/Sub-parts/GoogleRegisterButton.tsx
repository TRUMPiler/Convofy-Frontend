import React from 'react';
import { GoogleOAuthProvider, GoogleLogin, type GoogleCredentialResponse } from '@react-oauth/google';
import { jwtDecode,type JwtPayload } from 'jwt-decode';
import axios from 'axios';
import { toast } from 'sonner';
import Cookies from 'js-cookie';

const GoogleRegisterButton: React.FC = () => {
    let decoded: JwtPayload & { email?: string; picture?: string; name?: string }

    const handleSuccess = async (credentialResponse: GoogleCredentialResponse) => {
        try {
            decoded = jwtDecode<JwtPayload & { email?: string; picture?: string; name?: string }>(
                credentialResponse.credential ?? ''
            );

            console.log('Name:', decoded.name);
            console.log('Email:', decoded.email);
            console.log('Picture:', decoded.picture);

            const response = await axios.post(
                'https://3.108.249.57:8080/api/users', // This is the registration endpoint
                {
                    name: decoded.name,
                    email: decoded.email,
                    password: "GoogleLogin", // Use a placeholder password for Google registrations
                    image: decoded.picture,
                },
                { headers: { 'Content-Type': 'application/json' } }
            );

            console.log("Google Register Response Data:", response.data);

            if (response.data.success && response.data.data) {
                const { jwt, userId, name: userName, email: userEmail, image: userImage } = response.data.data;

                // Store JWT in a cookie
                Cookies.set('jwtToken', jwt, { expires: 1/2 }); // Expires in 12 hours (1/2 day)
                Cookies.set('userId', userId.toString());
                Cookies.set('name', userName || decoded.name || ""); // Use backend name, fallback to decoded, then empty
                Cookies.set('email', userEmail || decoded.email || ""); // Use backend email, fallback to decoded, then empty
                Cookies.set('avatar', userImage ?? decoded.picture ?? "https://github.com/shadcn.png"); // Use backend image, fallback to decoded, then default

                toast.success('Registration Successful! Welcome to Convofy!', { className: 'success' });
                
                setTimeout(() => {
                    window.location.href = '/';
                }, 1500);
            } else {
                toast.error(response.data.message ?? 'Registration Failed. Please Try Again', { className: 'error' });
            }
        } catch (error: any) {
            console.error('Error during Google registration:', error);
            if (error.response && error.response.status === 409) {
                toast.error("You are already registered. Please Login.", { className: "error" });
                // Optionally redirect to login page after a delay if registration fails due to existing email
                setTimeout(() => {
                    window.location.href = '/login';
                }, 1500);
            } else {
                toast.error('Registration Failed. An unexpected error occurred. Please try again.', { className: 'error' });
            } 
        }
    };

    const handleError = () => {
        console.error('Google Registration Failed');
        toast.error('Google Registration Failed. Please try again.', { className: 'error' });
    };

    return (
        <GoogleOAuthProvider clientId="750881943329-g7l3uorbajpe4lam6lu89l4afuspbe3l.apps.googleusercontent.com">
            <div className="flex justify-center mt-4">
                <GoogleLogin
                    onSuccess={handleSuccess}
                    onError={handleError}
                />
            </div>
        </GoogleOAuthProvider>
    );
};

export default GoogleRegisterButton;

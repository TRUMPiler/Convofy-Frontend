import React from 'react';
import { GoogleOAuthProvider, GoogleLogin, type GoogleCredentialResponse } from '@react-oauth/google';
import { jwtDecode, type JwtPayload } from 'jwt-decode';
import axios from 'axios';
import { toast } from 'sonner';
import Cookies from 'js-cookie';

const GoogleLoginButton: React.FC = () => {
  let decoded: JwtPayload & { email?: string; picture?: string; name?: string };

  const handleSuccess = async (credentialResponse: GoogleCredentialResponse) => {
    try {
      decoded = jwtDecode<JwtPayload & { email?: string; picture?: string; name?: string }>(
        credentialResponse.credential ?? ''
      );

      console.log('Name:', decoded.name);
      console.log('Email:', decoded.email);
      console.log('Picture:', decoded.picture);

      // Sending email and a placeholder password to your backend /api/users/login
      const response = await axios.post(
        'http://3.108.249.57:8080/api/users/login',
        {
          email: decoded.email,
          password: 'GoogleLogin', // This placeholder password should match what your backend expects for Google logins
        },
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      console.log("Google Login Response Data:", response.data);

      // Assuming backend's /login endpoint returns LoginResponse DTO with jwt
      if (response.data.success && response.data.data) {
        const { jwt, userId, name, email: userEmail, image } = response.data.data;

        // Store JWT in a cookie
        Cookies.set('jwtToken', jwt, { expires: 1/2 }); // Expires in 12 hours (1/2 day)
        Cookies.set('userId', userId.toString());
        Cookies.set('name', name ?? ""); // Use name from backend if available, fallback to decoded
        Cookies.set('email', userEmail ?? ""); // Use email from backend if available, fallback to decoded
        Cookies.set('avatar', image ?? "https://github.com/shadcn.png");

        toast.success('Login Successful! Welcome back!', { className: 'success' });
        
        setTimeout(() => {
          window.location.href = '/'; // Redirect to home page
        }, 1500);
      } else {
        toast.error(response.data.message || 'Login Failed. Please try again.', { className: 'error' });
      }
    } catch (error: any) {
      console.error('Error during Google login:', error);
      if (error.response && error.response.status === 401) {
        toast.error('Invalid credentials or user not registered. Please try again or register.', { className: 'error' });
      } else {
        toast.error('An error occurred. Please try again later.', { className: 'error' });
      }
    }
  };

  const handleError = () => {
    console.error('Google Login Failed');
    toast.error('Google Login Failed. Please try again.', { className: 'error' });
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

export default GoogleLoginButton;

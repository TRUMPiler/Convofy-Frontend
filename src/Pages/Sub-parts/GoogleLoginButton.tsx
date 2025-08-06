import React from 'react';
import { GoogleOAuthProvider, GoogleLogin, type GoogleCredentialResponse } from '@react-oauth/google';
import { jwtDecode, type JwtPayload } from 'jwt-decode';
import axios from 'axios';
import { toast } from 'sonner';
import Cookies from 'js-cookie';

const GoogleLoginButton: React.FC = () => {
  const handleSuccess = async (credentialResponse: GoogleCredentialResponse) => {
    try {
      const decoded = jwtDecode<JwtPayload & { email?: string; picture?: string; name?: string }>(
        credentialResponse.credential ?? ''
      );

      const response = await axios.post(
        'https://api.convofy.fun/api/users/google-login',
        {
          email: decoded.email,
          name: decoded.name,
          image: decoded.picture,
        },
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      console.log("Google Login/Register Response:", response.data);

      if (response.data.success && response.data.data) {
        const { jwt, userId, name, email: userEmail, image } = response.data.data;

        Cookies.set('jwtToken', jwt, { expires: 1/2 });
        Cookies.set('userId', userId.toString());
        Cookies.set('name', name ?? "");
        Cookies.set('email', userEmail ?? "");
        Cookies.set('avatar', image ?? "https://github.com/shadcn.png");

        toast.success(response.data.message || 'Login Successful! Welcome!', { className: 'success' });
        
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      } else {
        toast.error(response.data.message || 'Login Failed. Please try again.', { className: 'error' });
      }
    } catch (error: any) {
      console.error('Error during Google login/register:', error);
      toast.error(error.response?.data?.message || 'An error occurred. Please try again later.', { className: 'error' });
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
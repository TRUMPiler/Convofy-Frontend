import React from 'react';
import { GoogleOAuthProvider, GoogleLogin, type GoogleCredentialResponse } from '@react-oauth/google';
import { jwtDecode, type JwtPayload } from 'jwt-decode';
import axios from 'axios';
import { toast } from 'sonner';
import Cookies from 'js-cookie';
const GoogleLoginButton: React.FC = () => {
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
        'http://localhost:8080/api/users/login',
        {
          email: decoded.email,
          password: 'GoogleLogin',
        },
        { headers: { 'Content-Type': 'application/json' } }
      );
      console.log(response);
      if (response.status == 200 || response.data.success == true) {

        toast.success('Login Successful! Welcome back!', { className: 'success' });
        Cookies.set('userId', response.data.data.userid);
        Cookies.set('name', decoded.name ?? "");
        Cookies.set('email', decoded.email ?? "");
        Cookies.set('avatar', decoded.picture ?? "https://github.com/shadcn.png");
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      } else {
        console.log('Login failed' + response);
        toast.error('Login Failed', { className: 'error' });
      }
    } catch (error: any) {
      if (error.response.status == 401) { toast.error('Invalid email or password. Please try again.', { className: 'error' }); }
      else {
        console.error('Error during login:', error);
        toast.error('An error occurred. Please try again later.', { className: 'error' });
      }

    }
  };

  const handleError = () => {
    console.error('Google Login Failed');
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

import React from 'react';
import { GoogleOAuthProvider, GoogleLogin, type GoogleCredentialResponse } from '@react-oauth/google';
import  { jwtDecode,type JwtPayload } from 'jwt-decode';
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
        'http://localhost:8080/api/users',
        {
        
          name:decoded.name,
          email: decoded.email,
          password: "GoogleLogin",
          image: decoded.picture,
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.status == 200||response.data.success==true) {
        console.log(response);
        toast.success('Welcome to CodeNote', { className: 'success' });
        Cookies.set('userId', response.data.data.userId);
        Cookies.set('name', decoded.name??"");
        Cookies.set('email', decoded.email??"");
        Cookies.set('avatar', decoded.picture??"");
        setTimeout(() => {
            window.location.href = '/';
        },1500);
      } else {
        console.log('Registration failed:'+response.data);
        toast.error('Registration Failed Please Try Again', { className: 'error' });
      }
    } catch (error: any) {
      if(error.response!=undefined&&error.response.data.message=="User Already exists") { toast.error("You are already registered Please Login", { className: "error" }); console.error('Error during Google login:', error.response.data);}
       else if(error.response!=undefined&&error.response.data.message=="User is not logged in with google account") { toast.error("We could not find you\'re account with Google. Please Login with Website Crendentials", { className: "error" }); console.error('Error during Google login:', error.response.data);}
      else
      {
        toast.error('Registration Failed Please Try Again', { className: 'error' });
        console.error('Error during Google login:', error);
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

export default GoogleRegisterButton;

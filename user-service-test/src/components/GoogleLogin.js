import React from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

const GoogleLoginComponent = ({ setToken, setRole }) => {
  const handleSuccess = (response) => {
    console.log('Google login successful:', response);
    // Send the response token to your backend to verify and get the user info
    fetch('http://localhost:3000/api/v1/auth/google', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: response.credential }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log('Backend response:', data); // Debugging line
        if (data.data && data.data.user && data.data.user.role) {
          setToken(data.data.access_token);
          setRole(data.data.user.role);
          console.log('Google login successful:', data);
        } else {
          console.error('Invalid response format:', data);
        }
      })
      .catch((error) => {
        console.error('Error during Google login:', error);
      });
  };

  const handleError = (error) => {
    console.error('Google login failed:', error);
  };

  return (
    <GoogleOAuthProvider clientId="535297961400-daj0a7vsh8lg9so9ncg20lg1h9sn9r6v.apps.googleusercontent.com">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
      />
    </GoogleOAuthProvider>
  );
};

export default GoogleLoginComponent;
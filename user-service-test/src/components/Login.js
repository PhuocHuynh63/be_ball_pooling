import React, { useState } from 'react';
import { jwtDecode } from 'jwt-decode'; // Correct import

const Login = ({ setToken, setRole }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8080/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      console.log('Login response:', data); // Debugging line
      if (response.ok) {
        const accessToken = data.data.access_token;
        console.log('Access Token:', accessToken); // Debugging line
        if (typeof accessToken === 'string') {
          const decodedToken = jwtDecode(accessToken);
          setToken(accessToken);
          setRole(decodedToken.role);
          console.log('Login successful:', data);
        } else {
          console.error('Invalid token format:', accessToken);
        }
      } else {
        console.error('Login failed:', data.message);
      }
    } catch (error) {
      console.error('Error during login:', error);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <h2>Login</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">Login</button>
    </form>
  );
};

export default Login;
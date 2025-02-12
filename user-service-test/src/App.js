import React, { useState } from 'react';
import Signup from './components/Signup';
import Login from './components/Login';
import GoogleLoginComponent from './components/GoogleLogin';
import Admin from './components/Admin';
import Manager from './components/Manager';
import User from './components/User';

const App = () => {
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);

  const handleLogout = () => {
    setToken(null);
    setRole(null);
    console.log('Logout successful');
  };

  return (
    <div>
      <h1>User Service Test</h1>
      {!token ? (
        <>
          <Signup />
          <Login setToken={setToken} setRole={setRole} />
          <GoogleLoginComponent setToken={setToken} setRole={setRole} />
        </>
      ) : (
        <>
          {role === 'admin' && <Admin handleLogout={handleLogout} />}
          {role === 'manager' && <Manager handleLogout={handleLogout} />}
          {role === 'user' && <User handleLogout={handleLogout} />}
        </>
      )}
    </div>
  );
};

export default App;

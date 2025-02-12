import React from 'react';

const Logout = ({ setToken }) => {
  const handleLogout = () => {
    setToken(null);
    console.log('Logout successful');
  };

  return (
    <button onClick={handleLogout}>Logout</button>
  );
};

export default Logout;
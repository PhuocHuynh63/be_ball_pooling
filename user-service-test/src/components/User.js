import React from 'react';

const User = ({ handleLogout }) => {
  return (
    <div>
      <h2>User Screen</h2>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default User;
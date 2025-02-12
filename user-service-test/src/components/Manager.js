import React from 'react';

const Manager = ({ handleLogout }) => {
  return (
    <div>
      <h2>Manager Screen</h2>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default Manager;
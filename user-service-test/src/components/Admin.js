import React from 'react';

const Admin = ({ handleLogout }) => {
  return (
    <div>
      <h2>Admin Screen</h2>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default Admin;
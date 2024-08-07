import React from 'react';
import netlifyIdentity from './netlifyIdentity';

const LoginScreen = () => {
  return (
    <div className="login-screen">
      <h1>Welcome to the App</h1>
      <button className="login-button" onClick={() => netlifyIdentity.open()}>Log In</button>
    </div>
  );
};

export default LoginScreen;

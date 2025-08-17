import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';

const Login = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      console.log('Google auth successful:', user.displayName, user.email);
      // Firestore operations removed for debugging
      
      // Redirect to home page after successful login
      navigate('/');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>Welcome to Crapbook</h2>
        <p>Sign in with your Google account to get started</p>
        
        <button 
          onClick={handleGoogleLogin} 
          disabled={loading}
          className="google-btn"
        >
          {loading ? 'Signing in...' : 'Sign in with Google'}
        </button>
        
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
};

export default Login;

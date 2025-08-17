import React from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import Header from './Header';

const Home = () => {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return (
      <div>
        <Header />
        <main className="main-content">
          <p>Loading...</p>
        </main>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <main className="main-content">
        <div className="welcome-section">
          <h2>Welcome back, {user?.displayName || 'User'}!</h2>
          <p>This is your Crapbook timeline. Google auth is working!</p>
          <p>Firestore integration coming next...</p>
        </div>
        
        <div className="user-profile-preview">
          {user?.photoURL ? (
            <img 
              src={user.photoURL} 
              alt="Profile" 
              className="avatar-large-image"
            />
          ) : (
            <div className="avatar-large">
              {user?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          )}
          <div className="user-info-details">
            <h3>{user?.displayName}</h3>
            <p>{user?.email}</p>
            <p>Authenticated via Google</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;

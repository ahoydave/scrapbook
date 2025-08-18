import React from 'react';
import { signOut } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';

const Header = () => {
  const [user, loading] = useAuthState(auth);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <header className="header">
        <div className="header-content">
          <h1>Scrapbook</h1>
          <div>Loading...</div>
        </div>
      </header>
    );
  }

  return (
    <header className="header">
      <div className="header-content">
        <h1>Scrapbook</h1>
        {user && (
          <div className="user-info">
            <div className="user-details">
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt="Profile" 
                  className="avatar-image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className="avatar-placeholder"
                style={{ display: user.photoURL ? 'none' : 'flex' }}
              >
                {user.displayName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <span className="username">{user.displayName || user.email}</span>
            </div>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;


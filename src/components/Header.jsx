import React from 'react';
import { signOut } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Link, useLocation } from 'react-router-dom';
import { auth, db } from '../firebase';

const Header = () => {
  const [user, loading] = useAuthState(auth);
  const location = useLocation();

  // Get incoming friend requests by userId
  const [incomingByIdValue] = useCollection(
    user ? query(
      collection(db, 'friendRequests'),
      where('toUserId', '==', user.uid),
      where('status', '==', 'pending')
    ) : null,
    { snapshotListenOptions: { includeMetadataChanges: true } }
  );

  // Get incoming friend requests by email
  const [incomingByEmailValue] = useCollection(
    user ? query(
      collection(db, 'friendRequests'),
      where('toUserEmail', '==', user.email.toLowerCase()),
      where('status', '==', 'pending')
    ) : null,
    { snapshotListenOptions: { includeMetadataChanges: true } }
  );

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Calculate incoming requests only
  const getIncomingRequestsCount = () => {
    if (!user) return 0;

    // Get incoming requests
    const incomingByIdRequests = incomingByIdValue?.docs || [];
    const incomingByEmailRequests = incomingByEmailValue?.docs || [];
    
    // Combine and deduplicate incoming requests
    const allIncomingRequests = [...incomingByIdRequests, ...incomingByEmailRequests];
    const incomingRequestsMap = new Map();
    allIncomingRequests.forEach(doc => {
      incomingRequestsMap.set(doc.id, doc);
    });
    
    return incomingRequestsMap.size;
  };

  const incomingCount = getIncomingRequestsCount();

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
        <div className="header-left">
          <Link to="/" className="header-title">
            <h1>Scrapbook</h1>
          </Link>
          {user && (
            <nav className="header-nav">
              <Link 
                to="/" 
                className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
              >
                Home
              </Link>
              <Link 
                to="/friends" 
                className={`nav-link ${location.pathname === '/friends' ? 'active' : ''}`}
              >
                Friends
                {incomingCount > 0 && (
                  <span className="notification-badge">{incomingCount}</span>
                )}
              </Link>
            </nav>
          )}
        </div>
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


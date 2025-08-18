import React, { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { auth, db } from '../firebase';
import Header from './Header';
import FriendsList from './FriendsList';
import FriendRequests from './FriendRequests';
import AddFriend from './AddFriend';

const Friends = () => {
  const [user] = useAuthState(auth);
  const [activeTab, setActiveTab] = useState('friends');

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <Header />
      <div className="main-content">
        <div className="friends-container">
          <h2>Friends</h2>
          
          <div className="friends-tabs">
            <button 
              className={`tab-btn ${activeTab === 'friends' ? 'active' : ''}`}
              onClick={() => setActiveTab('friends')}
            >
              My Friends
            </button>
            <button 
              className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
              onClick={() => setActiveTab('requests')}
            >
              Friend Requests
            </button>
          </div>

          <div className="friends-content">
            {activeTab === 'friends' && (
              <div>
                <AddFriend userId={user.uid} />
                <FriendsList userId={user.uid} />
              </div>
            )}
            {activeTab === 'requests' && <FriendRequests userId={user.uid} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Friends;

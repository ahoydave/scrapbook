import React, { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import Header from './Header';
import PostCreator from './PostCreator';
import PostList from './PostList';

const Home = () => {
  const [user, loading] = useAuthState(auth);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handlePostCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

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
        <PostCreator onPostCreated={handlePostCreated} />
        
        <PostList refreshTrigger={refreshTrigger} />
      </main>
    </div>
  );
};

export default Home;

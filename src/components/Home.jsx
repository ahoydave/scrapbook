import React from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import Header from './header/Header';
import PostCreator from './PostCreator';
import PostList from './PostList';

const Home = () => {
  const [_, loading] = useAuthState(auth);

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
        <PostCreator />
        
        <PostList />
      </main>
    </div>
  );
};

export default Home;

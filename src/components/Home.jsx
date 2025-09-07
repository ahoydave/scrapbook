import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import PostCreator from './PostCreator';
import PostList from './PostList';

const Home = () => {
  const [_, loading] = useAuthState(auth);

  if (loading) {
    return (
      <div>
        <main className="main-content">
          <p>Loading...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-scrapbook-bg-main dark:bg-scrapbook-bg-dark min-h-screen">
       <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col">
        <PostCreator />
        <PostList />
      </main>
    </div>
  );
};

export default Home;

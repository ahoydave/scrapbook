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
    <div className="bg-[#e4f0f0] dark:bg-[#2b2b2b] min-h-screen">
       <main className="max-w-3xl mx-auto lg:px-8 py-6 flex flex-col">
        <PostCreator />
        <PostList />
      </main>
    </div>
  );
};

export default Home;

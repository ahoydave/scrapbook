import React, { useState, useEffect } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, orderBy, query, where, getDocs } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import Post from './Post';

const PostList = ({ refreshTrigger }) => {
  const [user] = useAuthState(auth);
  const [friendIds, setFriendIds] = useState(null);
  const [friendsLoading, setFriendsLoading] = useState(true);

  // Get user's friends
  useEffect(() => {
    const getFriends = async () => {
      if (!user) {
        setFriendIds([]);
        setFriendsLoading(false);
        return;
      }

      try {
        const friendshipsRef = collection(db, 'friendships');
        const snapshot = await getDocs(friendshipsRef);
        
        const userFriendIds = [];
        snapshot.docs.forEach(doc => {
          const friendship = doc.data();
          if (friendship.user1Id === user.uid) {
            userFriendIds.push(friendship.user2Id);
          } else if (friendship.user2Id === user.uid) {
            userFriendIds.push(friendship.user1Id);
          }
        });
        
        // Include the current user's ID so they can see their own posts
        setFriendIds([user.uid, ...userFriendIds]);
      } catch (error) {
        console.error('Error loading friends:', error);
        // Fallback to showing only user's own posts
        setFriendIds([user.uid]);
      } finally {
        setFriendsLoading(false);
      }
    };

    getFriends();
  }, [user]);

  // Get posts from friends and user (handle Firestore 'in' limit of 10)
  const [allPosts, setAllPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState(null);

  useEffect(() => {
    const getPosts = async () => {
      if (!friendIds || friendIds.length === 0) {
        setAllPosts([]);
        setPostsLoading(false);
        return;
      }

      try {
        setPostsLoading(true);
        const allPostsData = [];

        // Split friendIds into chunks of 10 (Firestore 'in' limit)
        const chunks = [];
        for (let i = 0; i < friendIds.length; i += 10) {
          chunks.push(friendIds.slice(i, i + 10));
        }

        // Query each chunk
        for (const chunk of chunks) {
          const q = query(
            collection(db, 'posts'),
            where('userId', 'in', chunk),
            orderBy('createdAt', 'desc')
          );
          const snapshot = await getDocs(q);
          const posts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          allPostsData.push(...posts);
        }

        // Sort all posts by creation time
        allPostsData.sort((a, b) => {
          if (!a.createdAt || !b.createdAt) return 0;
          return b.createdAt.seconds - a.createdAt.seconds;
        });

        setAllPosts(allPostsData);
        setPostsError(null);
      } catch (error) {
        console.error('Error loading posts:', error);
        setPostsError(error);
      } finally {
        setPostsLoading(false);
      }
    };

    getPosts();
  }, [friendIds]);

  if (friendsLoading || postsLoading) {
    return (
      <div className="post-list-loading">
        <div className="loading-spinner"></div>
        <p>Loading posts...</p>
      </div>
    );
  }

  if (postsError) {
    console.error('Error loading posts:', postsError);
    return (
      <div className="post-list-error">
        <p>Error loading posts. Please try refreshing the page.</p>
        <details>
          <summary>Error details</summary>
          <pre>{postsError.message}</pre>
        </details>
      </div>
    );
  }

  const posts = allPosts;

  if (posts.length === 0) {
    return (
      <div className="post-list-empty">
        {friendIds && friendIds.length === 1 ? (
          <div>
            <p>No posts yet. Be the first to share something!</p>
            <p>Add friends to see their posts in your timeline.</p>
          </div>
        ) : (
          <p>No posts from you or your friends yet. Share something!</p>
        )}
      </div>
    );
  }

  return (
    <div className="post-list">
      {posts.map(post => (
        <Post 
          key={post.id} 
          post={post} 
          onPostDeleted={(postId) => {
            // The real-time listener will automatically update the list
            console.log('Post deleted:', postId);
          }}
        />
      ))}
    </div>
  );
};

export default PostList;


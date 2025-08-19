import React, { useState, useEffect } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, orderBy, query, where, onSnapshot } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import Post from './Post';

const PostList = () => {
  const [user] = useAuthState(auth);
  const [friendIds, setFriendIds] = useState(null);
  const [friendsLoading, setFriendsLoading] = useState(true);

  // Get user's friendships with real-time updates
  const [friendshipsValue, friendshipsLoading, friendshipsError] = useCollection(
    user ? collection(db, 'friendships') : null,
    { snapshotListenOptions: { includeMetadataChanges: true } }
  );

  // Process friendships to get friend IDs
  useEffect(() => {
    if (!user) {
      setFriendIds([]);
      setFriendsLoading(false);
      return;
    }

    if (friendshipsLoading) {
      setFriendsLoading(true);
      return;
    }

    if (friendshipsError) {
      console.error('Error loading friendships:', friendshipsError);
      // Fallback to showing only user's own posts
      setFriendIds([user.uid]);
      setFriendsLoading(false);
      return;
    }

    try {
      const userFriendIds = [];
      if (friendshipsValue) {
        friendshipsValue.docs.forEach(doc => {
          const friendship = doc.data();
          if (friendship.user1Id === user.uid) {
            userFriendIds.push(friendship.user2Id);
          } else if (friendship.user2Id === user.uid) {
            userFriendIds.push(friendship.user1Id);
          }
        });
      }
      
      // Include the current user's ID so they can see their own posts
      setFriendIds([user.uid, ...userFriendIds]);
    } catch (error) {
      console.error('Error processing friendships:', error);
      // Fallback to showing only user's own posts
      setFriendIds([user.uid]);
    } finally {
      setFriendsLoading(false);
    }
  }, [user, friendshipsValue, friendshipsLoading, friendshipsError]);

  // Get posts from friends and user with real-time updates (handle Firestore 'in' limit of 10)
  const [allPosts, setAllPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState(null);

  useEffect(() => {
    if (!friendIds || friendIds.length === 0) {
      setAllPosts([]);
      setPostsLoading(false);
      return;
    }

    setPostsLoading(true);
    setPostsError(null);

    // Split friendIds into chunks of 10 (Firestore 'in' limit)
    const chunks = [];
    for (let i = 0; i < friendIds.length; i += 10) {
      chunks.push(friendIds.slice(i, i + 10));
    }

    // Keep track of all posts from all chunks
    const allPostsMap = new Map();
    let completedChunks = 0;
    const unsubscribeFunctions = [];

    const updateAllPosts = () => {
      // Combine all posts and sort by creation time
      const combinedPosts = Array.from(allPostsMap.values()).flat();
      combinedPosts.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.seconds - a.createdAt.seconds;
      });
      setAllPosts(combinedPosts);
    };

    // Set up real-time listener for each chunk
    chunks.forEach((chunk, index) => {
      const q = query(
        collection(db, 'posts'),
        where('userId', 'in', chunk),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const posts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // Update posts for this chunk
          allPostsMap.set(index, posts);
          
          // Mark this chunk as completed on first load
          if (completedChunks < chunks.length) {
            completedChunks++;
            if (completedChunks === chunks.length) {
              setPostsLoading(false);
            }
          }
          
          // Update the combined posts list
          updateAllPosts();
        },
        (error) => {
          console.error('Error listening to posts:', error);
          setPostsError(error);
          setPostsLoading(false);
        }
      );

      unsubscribeFunctions.push(unsubscribe);
    });

    // Cleanup function
    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
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


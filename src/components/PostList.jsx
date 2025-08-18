import React from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';
import Post from './Post';

const PostList = ({ refreshTrigger }) => {
  const [value, loading, error] = useCollection(
    query(collection(db, 'posts'), orderBy('createdAt', 'desc')),
    { snapshotListenOptions: { includeMetadataChanges: true } }
  );

  if (loading) {
    return (
      <div className="post-list-loading">
        <div className="loading-spinner"></div>
        <p>Loading posts...</p>
      </div>
    );
  }

  if (error) {
    console.error('Error loading posts:', error);
    return (
      <div className="post-list-error">
        <p>Error loading posts. Please try refreshing the page.</p>
        <details>
          <summary>Error details</summary>
          <pre>{error.message}</pre>
        </details>
      </div>
    );
  }

  const posts = value?.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) || [];

  if (posts.length === 0) {
    return (
      <div className="post-list-empty">
        <p>No posts yet. Be the first to share something!</p>
      </div>
    );
  }

  return (
    <div className="post-list">
      {posts.map(post => (
        <Post key={post.id} post={post} />
      ))}
    </div>
  );
};

export default PostList;


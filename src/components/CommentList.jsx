import React from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import Comment from './Comment';

const CommentList = ({ postId }) => {
  // Try the optimized query first (requires index)
  const [value, loading, error] = useCollection(
    query(
      collection(db, 'comments'), 
      where('postId', '==', postId),
      orderBy('createdAt', 'asc')
    ),
    { snapshotListenOptions: { includeMetadataChanges: true } }
  );

  // Fallback query without orderBy if index is not ready
  const [fallbackValue, fallbackLoading, fallbackError] = useCollection(
    error && error.message && error.message.includes('index') ? 
    query(collection(db, 'comments'), where('postId', '==', postId)) : 
    null,
    { snapshotListenOptions: { includeMetadataChanges: true } }
  );

  // Use fallback data if main query failed due to missing index
  const actualValue = error && error.message && error.message.includes('index') ? fallbackValue : value;
  const actualLoading = error && error.message && error.message.includes('index') ? fallbackLoading : loading;
  const actualError = error && error.message && error.message.includes('index') ? fallbackError : error;

  if (actualLoading) {
    return (
      <div className="comments-loading">
        <div className="loading-spinner-small"></div>
        <span>Loading comments...</span>
      </div>
    );
  }

  if (actualError) {
    console.error('Error loading comments:', actualError);
    return (
      <div className="comments-error">
        <p>Error loading comments. Please try refreshing the page.</p>
      </div>
    );
  }

  const comments = actualValue?.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) || [];

  // Sort comments manually if using fallback query (no orderBy)
  if (error && error.message && error.message.includes('index')) {
    comments.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return a.createdAt.seconds - b.createdAt.seconds;
    });
  }

  if (comments.length === 0) {
    return null;
  }

  return (
    <div className="comment-list">
      {comments.map(comment => (
        <Comment key={comment.id} comment={comment} />
      ))}
    </div>
  );
};

export default CommentList;
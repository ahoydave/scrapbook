import React, { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

const CommentForm = ({ postId }) => {
  const [user] = useAuthState(auth);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim() || !user) return;

    setSubmitting(true);

    try {
      await addDoc(collection(db, 'comments'), {
        postId,
        userId: user.uid,
        userDisplayName: user.displayName || 'Anonymous',
        userPhotoURL: user.photoURL || null,
        content: content.trim(),
        createdAt: serverTimestamp()
      });
      
      setContent('');
    } catch (error) {
      console.error('Error creating comment:', error);
      alert('Failed to post comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <form onSubmit={handleSubmit} className="comment-form">
      <div className="comment-form-header">
        {user.photoURL ? (
          <img 
            src={user.photoURL} 
            alt={`${user.displayName}'s profile`} 
            className="comment-form-avatar"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div 
          className="comment-form-avatar-placeholder" 
          style={{ display: user.photoURL ? 'none' : 'flex' }}
        >
          {user.displayName?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a comment..."
          className="comment-form-input"
          disabled={submitting}
        />
        <button 
          type="submit" 
          disabled={!content.trim() || submitting}
          className="comment-form-submit"
        >
          {submitting ? '...' : 'Post'}
        </button>
      </div>
    </form>
  );
};

export default CommentForm;

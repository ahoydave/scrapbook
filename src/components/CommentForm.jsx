import React, { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import MentionInput from './MentionInput';
import { convertToStorageFormat } from '../utils/mentionUtils.jsx';

const CommentForm = ({ postId }) => {
  const [user] = useAuthState(auth);
  const [content, setContent] = useState('');
  const [mentions, setMentions] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim() || !user) return;

    setSubmitting(true);

    try {
      // Convert display text to storage format using selected friends
      const storageContent = convertToStorageFormat(content.trim(), mentions);
      
      await addDoc(collection(db, 'comments'), {
        postId,
        userId: user.uid,
        userDisplayName: user.displayName || 'Anonymous',
        userPhotoURL: user.photoURL || null,
        content: storageContent,
        mentions: mentions.map(m => ({ userId: m.userId, displayName: m.displayName })),
        createdAt: serverTimestamp()
      });
      
      setContent('');
      setMentions([]);
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
        <MentionInput
          value={content}
          onChange={setContent}
          onMentionsChange={setMentions}
          placeholder="Write a comment... (use @ to mention friends)"
          className="comment-form-input comment-mention-input"
          disabled={submitting}
          rows={1}
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

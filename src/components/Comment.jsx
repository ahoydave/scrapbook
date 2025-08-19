import React, { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import Reactions from './Reactions';
import { renderTextWithMentions, isUserMentioned } from '../utils/mentionUtils.jsx';

const Comment = ({ comment }) => {
  const [user] = useAuthState(auth);
  const [deleting, setDeleting] = useState(false);

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    setDeleting(true);
    
    try {
      await deleteDoc(doc(db, 'comments', comment.id));
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  // Check if current user is the comment author
  const canDelete = user && user.uid === comment.userId;

  // Check if current user is mentioned in this comment
  const userMentioned = user && isUserMentioned(comment.content, user.uid);

  return (
    <div className={`comment ${userMentioned ? 'mentioned' : ''}`}>
      <div className="comment-author">
        {comment.userPhotoURL ? (
          <img 
            src={comment.userPhotoURL} 
            alt={`${comment.userDisplayName}'s profile`} 
            className="comment-avatar"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div 
          className="comment-avatar-placeholder" 
          style={{ display: comment.userPhotoURL ? 'none' : 'flex' }}
        >
          {comment.userDisplayName?.charAt(0)?.toUpperCase() || 'U'}
        </div>
      </div>
      
      <div className="comment-content">
        <div className="comment-bubble">
          <div className="comment-header">
            <div className="comment-author-name">{comment.userDisplayName}</div>
            {canDelete && (
              <button 
                onClick={handleDelete}
                disabled={deleting}
                className="comment-delete-btn"
                title="Delete comment"
              >
                {deleting ? '...' : '×'}
              </button>
            )}
          </div>
          <div className="comment-text">{renderTextWithMentions(comment.content, user?.uid)}</div>
        </div>
        <div className="comment-meta">
          <div className="comment-timestamp">{formatDate(comment.createdAt)}</div>
          <Reactions targetType="comment" targetId={comment.id} />
        </div>
      </div>
    </div>
  );
};

export default Comment;

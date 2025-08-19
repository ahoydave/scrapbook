import React, { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { auth, db, storage } from '../firebase';
import CommentList from './CommentList';
import CommentForm from './CommentForm';
import Reactions from './Reactions';

const Post = ({ post, onPostDeleted }) => {
  const [user] = useAuthState(auth);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content || '');
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    setDeleting(true);
    
    try {
      // Delete media file from Storage if it exists
      if (post.mediaURL) {
        try {
          // Extract the file path from the download URL
          const url = new URL(post.mediaURL);
          const pathMatch = url.pathname.match(/\/o\/(.+?)\?/);
          if (pathMatch) {
            const filePath = decodeURIComponent(pathMatch[1]);
            const fileRef = ref(storage, filePath);
            await deleteObject(fileRef);
          }
        } catch (error) {
          console.error('Error deleting media file:', error);
          // Continue with post deletion even if file deletion fails
        }
      }

      // Delete post document from Firestore
      await deleteDoc(doc(db, 'posts', post.id));
      
      // Notify parent component if callback provided
      if (onPostDeleted) {
        onPostDeleted(post.id);
      }
      
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
    setEditContent(post.content || '');
  };

  const handleSaveEdit = async () => {
    if (editContent.trim() === post.content) {
      setEditing(false);
      return;
    }

    try {
      await updateDoc(doc(db, 'posts', post.id), {
        content: editContent.trim(),
        updatedAt: serverTimestamp(),
        edited: true
      });
      setEditing(false);
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Failed to update post. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setEditContent(post.content || '');
  };

  // Check if current user is the post author
  const canEdit = user && user.uid === post.userId;

  // Check if post was edited
  const wasEdited = post.edited && post.updatedAt && post.createdAt && 
    post.updatedAt.seconds !== post.createdAt.seconds;

  return (
    <article className="post">
      <header className="post-header">
        <div className="post-author">
          {post.userPhotoURL ? (
            <img 
              src={post.userPhotoURL} 
              alt={`${post.userDisplayName}'s profile`} 
              className="post-avatar"
              onError={(e) => {
                // Hide the failed image and show placeholder
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className="post-avatar-placeholder" 
            style={{ display: post.userPhotoURL ? 'none' : 'flex' }}
          >
            {post.userDisplayName?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="post-author-info">
            <h3 className="post-author-name">{post.userDisplayName}</h3>
            <time className="post-timestamp">{formatDate(post.createdAt)}</time>
          </div>
        </div>
        
        {canEdit && (
          <div className="post-actions">
            {!editing && (
              <button 
                onClick={handleEdit}
                className="post-edit-btn"
                title="Edit post"
              >
                ✎
              </button>
            )}
            <button 
              onClick={handleDelete}
              disabled={deleting}
              className="post-delete-btn"
              title="Delete post"
            >
              {deleting ? '...' : '×'}
            </button>
          </div>
        )}
      </header>

      {(post.content || editing) && (
        <div className="post-content">
          {editing ? (
            <div className="post-edit-form">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="post-edit-textarea"
                rows="3"
                placeholder="Add text"
              />
              <div className="post-edit-actions">
                <button 
                  onClick={handleSaveEdit}
                  className="post-save-btn"
                  disabled={!editContent.trim()}
                >
                  Save
                </button>
                <button 
                  onClick={handleCancelEdit}
                  className="post-cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p>{post.content}</p>
              {wasEdited && (
                <p className="post-edited-indicator">
                  edited {formatDate(post.updatedAt)}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {post.mediaURL && (
        <div className="post-media">
          {post.mediaType === 'image' ? (
            <img 
              src={post.mediaURL} 
              alt="Post content" 
              className="post-image"
              loading="lazy"
            />
          ) : post.mediaType === 'video' ? (
            <video 
              src={post.mediaURL} 
              controls 
              className="post-video"
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
          ) : null}
        </div>
      )}

      <Reactions targetType="post" targetId={post.id} />

      <div className="post-comments-section">
        <CommentList postId={post.id} />
        <CommentForm postId={post.id} />
      </div>
    </article>
  );
};

export default Post;


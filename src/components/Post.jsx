import React from 'react';

const Post = ({ post }) => {
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

  return (
    <article className="post">
      <header className="post-header">
        <div className="post-author">
          {post.userPhotoURL ? (
            <img 
              src={post.userPhotoURL} 
              alt={`${post.userDisplayName}'s profile`} 
              className="post-avatar"
            />
          ) : (
            <div className="post-avatar-placeholder">
              {post.userDisplayName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          )}
          <div className="post-author-info">
            <h3 className="post-author-name">{post.userDisplayName}</h3>
            <time className="post-timestamp">{formatDate(post.createdAt)}</time>
          </div>
        </div>
      </header>

      {post.content && (
        <div className="post-content">
          <p>{post.content}</p>
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
    </article>
  );
};

export default Post;


import React, { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../firebase';
import MentionInput from './MentionInput';
import { convertToStorageFormat } from '../utils/mentionUtils.jsx';

const PostCreator = () => {
  const [user] = useAuthState(auth);
  const [content, setContent] = useState('');
  const [mentions, setMentions] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/mov', 'video/quicktime'];
    
    if (!validImageTypes.includes(file.type) && !validVideoTypes.includes(file.type)) {
      setError('Please select a valid image (JPEG, PNG, GIF, WebP) or video (MP4, WebM, MOV) file.');
      return;
    }

    // Validate file size (10MB for images, 50MB for videos)
    const maxSize = validImageTypes.includes(file.type) ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`File size too large. Maximum ${validImageTypes.includes(file.type) ? '10MB' : '50MB'} allowed.`);
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setFilePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setError(null);
  };

  const uploadFile = async (file, postId) => {
    const fileExtension = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExtension}`;
    const storagePath = `posts/${user.uid}/${postId}/${fileName}`;
    const storageRef = ref(storage, storagePath);
    
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Upload error:', error);
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim() && !selectedFile) {
      setError('Please add some content or select a file to post.');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Convert display text to storage format using selected friends
      const storageContent = convertToStorageFormat(content.trim(), mentions);
      
      // Create the post document first
      const postData = {
        userId: user.uid,
        userDisplayName: user.displayName || user.email,
        userPhotoURL: user.photoURL || null,
        content: storageContent,
        mentions: mentions.map(m => ({ userId: m.userId, displayName: m.displayName })),
        mediaType: 'none',
        mediaURL: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'posts'), postData);

      // Upload file if selected
      if (selectedFile) {
        const mediaURL = await uploadFile(selectedFile, docRef.id);
        const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        const mediaType = validImageTypes.includes(selectedFile.type) ? 'image' : 'video';

        // Update the existing post with media information
        await updateDoc(docRef, {
          mediaType,
          mediaURL,
          updatedAt: serverTimestamp()
        });
      }

      // Reset form
      setContent('');
      setMentions([]);
      setSelectedFile(null);
      setFilePreview(null);
      setUploadProgress(0);

      // Post created successfully - real-time listener will update the timeline

    } catch (error) {
      console.error('Error creating post:', error);
      setError('Failed to create post. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="post-creator">
      <div className="post-creator-header">
        {user?.photoURL ? (
          <img 
            src={user.photoURL} 
            alt="Your profile" 
            className="post-creator-avatar"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div 
          className="post-creator-avatar-placeholder"
          style={{ display: user?.photoURL ? 'none' : 'flex' }}
        >
          {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <span className="post-creator-name">{user?.displayName || 'You'}</span>
      </div>

      <form onSubmit={handleSubmit} className="post-creator-form">
        <MentionInput
          value={content}
          onChange={setContent}
          onMentionsChange={setMentions}
          placeholder="Add text (use @ to mention friends)"
          className="post-content-input"
          rows="3"
          disabled={uploading}
        />

        {filePreview && (
          <div className="file-preview">
            {selectedFile && selectedFile.type.startsWith('image/') ? (
              <img src={filePreview} alt="Preview" className="preview-image" />
            ) : (
              <video src={filePreview} controls className="preview-video" />
            )}
            <button 
              type="button" 
              onClick={removeFile} 
              className="remove-file-btn"
              disabled={uploading}
            >
              ×
            </button>
          </div>
        )}

        <div className="post-creator-actions">
          <input
            type="file"
            id="file-input"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            disabled={uploading}
          />
          <label htmlFor="file-input" className="file-input-label">
            📷 Add Photo/Video
          </label>

          <button 
            type="submit" 
            className="post-submit-btn"
            disabled={uploading || (!content.trim() && !selectedFile)}
          >
            {uploading ? `Posting... ${Math.round(uploadProgress)}%` : 'Post'}
          </button>
        </div>

        {error && <div className="post-error">{error}</div>}
      </form>
    </div>
  );
};

export default PostCreator;

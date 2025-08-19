import React, { useState, useEffect, useRef } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where, orderBy, addDoc, deleteDoc, doc, getDocs, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

const Reactions = ({ targetType, targetId }) => {
  const [user] = useAuthState(auth);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });
  const emojiPickerRef = useRef(null);
  const addButtonRef = useRef(null);

  // Get all reactions for this target
  const [reactionsValue, reactionsLoading, reactionsError] = useCollection(
    targetType && targetId ? query(
      collection(db, 'reactions'),
      where('targetType', '==', targetType),
      where('targetId', '==', targetId),
      orderBy('createdAt', 'desc')
    ) : null,
    { snapshotListenOptions: { includeMetadataChanges: true } }
  );

  // Common emoji options - 24 most popular reactions
  const emojiOptions = [
    '👍', '❤️', '😂', '😮', '😢', '😡', 
    '👏', '🔥', '💯', '✨', '🙌', '👌',
    '😍', '🤔', '😊', '😭', '🥳', '😎',
    '🤗', '😴', '🤯', '🙄', '😬', '🤩'
  ];

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showEmojiPicker]);

  const calculatePickerPosition = (buttonElement, isComment = false) => {
    const rect = buttonElement.getBoundingClientRect();
    const pickerWidth = 180;
    const pickerHeight = 120; // Approximate height
    
    let left, top;
    
    if (isComment) {
      // For comments, position to the left
      left = rect.left - pickerWidth + rect.width;
    } else {
      // For posts, position to the right
      left = rect.left;
    }
    
    // Position above the button
    top = rect.top - pickerHeight - 8;
    
    // Ensure picker doesn't go off-screen
    const maxLeft = window.innerWidth - pickerWidth - 16;
    const minLeft = 16;
    left = Math.max(minLeft, Math.min(maxLeft, left));
    
    if (top < 16) {
      top = rect.bottom + 8; // Position below if no space above
    }
    
    return { top, left };
  };

  const handleToggleEmojiPicker = () => {
    if (!showEmojiPicker && addButtonRef.current) {
      const isComment = targetType === 'comment';
      const position = calculatePickerPosition(addButtonRef.current, isComment);
      setPickerPosition(position);
    }
    setShowEmojiPicker(!showEmojiPicker);
  };

  const handleAddReaction = async (emoji) => {
    if (!user) return;

    try {
      // Check if user already has this exact reaction
      const existingQuery = query(
        collection(db, 'reactions'),
        where('targetType', '==', targetType),
        where('targetId', '==', targetId),
        where('userId', '==', user.uid),
        where('emoji', '==', emoji)
      );
      
      const existingDocs = await getDocs(existingQuery);
      
      if (!existingDocs.empty) {
        // User already has this reaction, don't add duplicate
        return;
      }

      // Add the reaction
      await addDoc(collection(db, 'reactions'), {
        targetType,
        targetId,
        userId: user.uid,
        userDisplayName: user.displayName || 'Anonymous',
        emoji,
        createdAt: serverTimestamp()
      });
      
      setShowEmojiPicker(false);
    } catch (error) {
      console.error('Error adding reaction:', error);
      alert('Failed to add reaction. Please try again.');
    }
  };

  const handleRemoveReaction = async (reactionId) => {
    if (!user) return;

    try {
      await deleteDoc(doc(db, 'reactions', reactionId));
    } catch (error) {
      console.error('Error removing reaction:', error);
      alert('Failed to remove reaction. Please try again.');
    }
  };

  const handleEmojiClick = (emoji) => {
    if (!user) return;

    // Check if user already has this reaction
    const userReaction = reactions.find(r => r.userId === user.uid && r.emoji === emoji);
    
    if (userReaction) {
      // Remove the reaction
      handleRemoveReaction(userReaction.id);
    } else {
      // Add the reaction
      handleAddReaction(emoji);
    }
  };

  if (reactionsLoading) {
    return null; // Don't show loading state for reactions
  }

  if (reactionsError) {
    console.error('Reactions error:', reactionsError);
    console.error('Error details:', {
      targetType,
      targetId,
      errorCode: reactionsError.code,
      errorMessage: reactionsError.message
    });
    return null; // Gracefully hide reactions on error
  }

  const reactions = reactionsValue?.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) || [];

  // Group reactions by emoji and count them
  const reactionGroups = reactions.reduce((groups, reaction) => {
    const emoji = reaction.emoji;
    if (!groups[emoji]) {
      groups[emoji] = {
        emoji,
        count: 0,
        users: [],
        userHasReacted: false
      };
    }
    groups[emoji].count++;
    groups[emoji].users.push(reaction);
    
    if (user && reaction.userId === user.uid) {
      groups[emoji].userHasReacted = true;
    }
    
    return groups;
  }, {});

  const sortedGroups = Object.values(reactionGroups).sort((a, b) => b.count - a.count);

  return (
    <div className="reactions-container">
      <div className="reactions-display">
        {sortedGroups.map(group => (
          <button
            key={group.emoji}
            className={`reaction-button ${group.userHasReacted ? 'user-reacted' : ''}`}
            onClick={() => handleEmojiClick(group.emoji)}
            title={`${group.users.map(u => u.userDisplayName).join(', ')}`}
          >
            <span className="reaction-emoji">{group.emoji}</span>
            {group.count > 1 && (
              <span className="reaction-count">{group.count}</span>
            )}
          </button>
        ))}
        
        {user && (
          <div className="add-reaction">
            <button
              ref={addButtonRef}
              className="add-reaction-button"
              onClick={handleToggleEmojiPicker}
            >
              +
            </button>
          </div>
        )}
        
        {showEmojiPicker && (
          <div 
            className="emoji-picker" 
            ref={emojiPickerRef}
            style={{
              top: `${pickerPosition.top}px`,
              left: `${pickerPosition.left}px`
            }}
          >
            {emojiOptions.map(emoji => (
              <button
                key={emoji}
                className="emoji-option"
                onClick={() => handleAddReaction(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reactions;

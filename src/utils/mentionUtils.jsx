import React from 'react';

// Simple mention format: @(DisplayName:userId)
// This is much simpler and cleaner

// Parse text and convert mentions to React elements
export const renderTextWithMentions = (text, currentUserId = null) => {
  if (!text) return text;

  // Handle both new format @(Name:userId) and old format @[Name](userId)
  const newMentionRegex = /@\(([^:]+):([^)]+)\)/g;
  const oldMentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  
  let processedText = text;
  const parts = [];
  let lastIndex = 0;
  
  // First, find all mentions (both formats) and their positions
  const allMentions = [];
  
  // Find new format mentions
  let match;
  while ((match = newMentionRegex.exec(text)) !== null) {
    allMentions.push({
      index: match.index,
      length: match[0].length,
      displayName: match[1],
      userId: match[2],
      format: 'new'
    });
  }
  
  // Find old format mentions
  while ((match = oldMentionRegex.exec(text)) !== null) {
    allMentions.push({
      index: match.index,
      length: match[0].length,
      displayName: match[1],
      userId: match[2],
      format: 'old'
    });
  }
  
  // Sort mentions by position
  allMentions.sort((a, b) => a.index - b.index);
  
  // Process mentions in order
  allMentions.forEach((mention, i) => {
    // Add text before the mention
    if (mention.index > lastIndex) {
      parts.push(text.substring(lastIndex, mention.index));
    }

    const isCurrentUser = currentUserId && mention.userId === currentUserId;

    // Add the mention with simple styling
    parts.push(
      <span
        key={`mention-${mention.index}`}
        className={`mention ${isCurrentUser ? 'mention-highlighted' : ''}`}
        title={`Mentioned: ${mention.displayName}`}
      >
        @{mention.displayName}
      </span>
    );

    lastIndex = mention.index + mention.length;
  });

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 1 ? parts : text;
};

// Extract mention data from text
export const extractMentions = (text) => {
  if (!text) return [];
  
  const mentions = [];
  
  // Handle new format @(Name:userId)
  const newMentionRegex = /@\(([^:]+):([^)]+)\)/g;
  let match;
  while ((match = newMentionRegex.exec(text)) !== null) {
    mentions.push({
      displayName: match[1],
      userId: match[2]
    });
  }
  
  // Handle old format @[Name](userId)
  const oldMentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  while ((match = oldMentionRegex.exec(text)) !== null) {
    mentions.push({
      displayName: match[1],
      userId: match[2]
    });
  }
  
  return mentions;
};

// Check if current user is mentioned in text
export const isUserMentioned = (text, userId) => {
  if (!text || !userId) return false;
  
  // Check new format @(Name:userId)
  const newMentionRegex = /@\(([^:]+):([^)]+)\)/g;
  let match;
  while ((match = newMentionRegex.exec(text)) !== null) {
    if (match[2] === userId) return true;
  }
  
  // Check old format @[Name](userId)
  const oldMentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  while ((match = oldMentionRegex.exec(text)) !== null) {
    if (match[2] === userId) return true;
  }
  
  return false;
};

// Convert clean display text with selected friends to storage format
export const convertToStorageFormat = (displayText, selectedFriends) => {
  if (!displayText || !selectedFriends || selectedFriends.length === 0) {
    return displayText;
  }
  
  let storageText = displayText;
  
  // Replace each @Name with @(Name:userId) using the selectedFriends array
  selectedFriends.forEach(friend => {
    const displayMention = `@${friend.displayName}`;
    const storageMention = `@(${friend.displayName}:${friend.userId})`;
    storageText = storageText.replace(new RegExp(displayMention.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), storageMention);
  });
  
  return storageText;
};

import React from 'react';

// Simple mention format: @(DisplayName:userId)
// This is much simpler and cleaner

// Parse text and convert mentions and URLs to React elements
export const renderTextWithMentions = (text, currentUserId = null) => {
  if (!text) return text;

  // Handle both new format @(Name:userId) and old format @[Name](userId)
  const newMentionRegex = /@\(([^:]+):([^)]+)\)/g;
  const oldMentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;

  // URL regex - matches http, https, and www URLs
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;

  const parts = [];
  let lastIndex = 0;

  // First, find all mentions (both formats) and URLs and their positions
  const allElements = [];

  // Find new format mentions
  let match;
  while ((match = newMentionRegex.exec(text)) !== null) {
    allElements.push({
      type: 'mention',
      index: match.index,
      length: match[0].length,
      displayName: match[1],
      userId: match[2],
      format: 'new'
    });
  }

  // Find old format mentions
  while ((match = oldMentionRegex.exec(text)) !== null) {
    allElements.push({
      type: 'mention',
      index: match.index,
      length: match[0].length,
      displayName: match[1],
      userId: match[2],
      format: 'old'
    });
  }

  // Find URLs
  while ((match = urlRegex.exec(text)) !== null) {
    allElements.push({
      type: 'url',
      index: match.index,
      length: match[0].length,
      url: match[0]
    });
  }

  // Sort all elements by position
  allElements.sort((a, b) => a.index - b.index);

  // Process all elements in order
  allElements.forEach((element, i) => {
    // Add text before the element
    if (element.index > lastIndex) {
      parts.push(text.substring(lastIndex, element.index));
    }

    if (element.type === 'mention') {
      const isCurrentUser = currentUserId && element.userId === currentUserId;

      // Add the mention with simple styling
      parts.push(
        <span
          key={`mention-${element.index}`}
          className={`mention ${isCurrentUser ? 'mention-highlighted' : ''}`}
          title={`Mentioned: ${element.displayName}`}
        >
          @{element.displayName}
        </span>
      );
    } else if (element.type === 'url') {
      // Add the URL as a clickable link
      const url = element.url.startsWith('http') ? element.url : `https://${element.url}`;
      parts.push(
        <a
          key={`url-${element.index}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="post-link"
        >
          {element.url}
        </a>
      );
    }

    lastIndex = element.index + element.length;
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

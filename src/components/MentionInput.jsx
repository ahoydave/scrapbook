import React, { useState, useRef, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import { useFriends } from '../utils/useFriends';
import { extractMentions } from '../utils/mentionUtils.jsx';

const MentionInput = ({ 
  value, 
  onChange, 
  placeholder, 
  className,
  disabled,
  rows = 3,
  onMentionsChange
}) => {
  const [user] = useAuthState(auth);
  const { friends } = useFriends(user);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredFriends, setFilteredFriends] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectedFriends, setSelectedFriends] = useState([]); // Track selected friends
  const textareaRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Convert storage format to clean display format for the input
  const getDisplayValue = (text) => {
    if (!text) return text;
    // Convert both formats to clean @Name display
    return text
      .replace(/@\(([^:]+):([^)]+)\)/g, '@$1')  // New format
      .replace(/@\[([^\]]+)\]\(([^)]+)\)/g, '@$1'); // Old format
  };

  // Initialize selected friends from existing text
  useEffect(() => {
    if (value) {
      const mentions = extractMentions(value);
      setSelectedFriends(mentions);
    }
  }, []); // Only run once on mount

  // Handle text changes and detect @ symbol
  const handleTextChange = (e) => {
    const displayValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    // Store the clean display value
    onChange(displayValue);
    setCursorPosition(cursorPos);

    // Check if we're typing after an @ symbol
    const textBeforeCursor = displayValue.substring(0, cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf('@');
    
    if (atIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(atIndex + 1);
      // Only show suggestions if there's no space after @
      if (!textAfterAt.includes(' ') && textAfterAt.length <= 50) {
        const filtered = friends.filter(friend =>
          friend.displayName.toLowerCase().includes(textAfterAt.toLowerCase())
        );
        setFilteredFriends(filtered);
        setShowSuggestions(filtered.length > 0);
        setSelectedIndex(0);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }

      // Update selected friends based on current @mentions in text
  updateSelectedFriendsFromText(displayValue);
  };

  // Update selected friends array based on @mentions in text
  const updateSelectedFriendsFromText = (text) => {
    const mentionRegex = /@(\w+(?:\s+\w+)*)/g;
    const mentionedNames = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      mentionedNames.push(match[1]);
    }
    
    // Keep only friends that are still mentioned in the text
    const updatedFriends = selectedFriends.filter(friend => 
      mentionedNames.includes(friend.displayName)
    );
    
    setSelectedFriends(updatedFriends);
    
    // Notify parent of current mentions
    if (onMentionsChange) {
      onMentionsChange(updatedFriends);
    }
  };

  // Handle keyboard navigation in suggestions
  const handleKeyDown = (e) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredFriends.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredFriends.length - 1
        );
        break;
      case 'Enter':
      case 'Tab':
        e.preventDefault();
        if (filteredFriends[selectedIndex]) {
          insertMention(filteredFriends[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
      default:
        break;
    }
  };

  // Insert a mention into the text - clean display format
  const insertMention = (friend) => {
    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);
    const atIndex = textBeforeCursor.lastIndexOf('@');
    
    const beforeAt = value.substring(0, atIndex);
    const mention = `@${friend.displayName}`;
    const newValue = beforeAt + mention + ' ' + textAfterCursor;
    
    // Add friend to selected friends array
    const updatedFriends = [...selectedFriends];
    const existingIndex = updatedFriends.findIndex(f => f.userId === friend.id);
    if (existingIndex === -1) {
      updatedFriends.push({
        displayName: friend.displayName,
        userId: friend.id
      });
    }
    setSelectedFriends(updatedFriends);
    
    onChange(newValue);
    setShowSuggestions(false);
    
    // Set cursor position after the mention
    const newCursorPos = beforeAt.length + mention.length + 1;
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        textareaRef.current.focus();
      }
    }, 0);

    // Notify parent of updated mentions
    if (onMentionsChange) {
      onMentionsChange(updatedFriends);
    }
  };

  // Handle clicking on a suggestion
  const handleSuggestionClick = (friend) => {
    insertMention(friend);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="mention-input-container">
      <textarea
        ref={textareaRef}
        value={getDisplayValue(value)}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
        rows={rows}
      />
      
      {showSuggestions && filteredFriends.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="mention-suggestions"
        >
          {filteredFriends.map((friend, index) => (
            <div
              key={friend.id}
              className={`mention-suggestion ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => handleSuggestionClick(friend)}
            >
              {friend.photoURL ? (
                <img 
                  src={friend.photoURL} 
                  alt={friend.displayName}
                  className="mention-suggestion-avatar"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className="mention-suggestion-avatar-placeholder"
                style={{ display: friend.photoURL ? 'none' : 'flex' }}
              >
                {friend.displayName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <span className="mention-suggestion-name">{friend.displayName}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MentionInput;

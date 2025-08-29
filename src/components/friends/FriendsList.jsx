import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';

const FriendsList = ({ userId }) => {
  // Get friendships where user is either user1 or user2
  const [friendshipsValue, friendshipsLoading, friendshipsError] = useCollection(
    query(collection(db, 'friendships'), orderBy('createdAt', 'desc')),
    { snapshotListenOptions: { includeMetadataChanges: true } }
  );

  // Get all users to match friend IDs with user info
  const [usersValue, usersLoading, usersError] = useCollection(
    collection(db, 'users'),
    { snapshotListenOptions: { includeMetadataChanges: true } }
  );

  const handleRemoveFriend = async (friendshipId, friendName) => {
    if (!window.confirm(`Are you sure you want to remove ${friendName} as a friend?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'friendships', friendshipId));
    } catch (error) {
      console.error('Error removing friend:', error);
      alert('Failed to remove friend. Please try again.');
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (friendshipsLoading || usersLoading) {
    return <div className="loading">Loading friends...</div>;
  }

  if (friendshipsError || usersError) {
    return <div className="error">Error loading friends.</div>;
  }

  // Create a map of user IDs to user data
  const usersMap = {};
  if (usersValue) {
    usersValue.docs.forEach(doc => {
      usersMap[doc.id] = { id: doc.id, ...doc.data() };
    });
  }

  // Filter friendships where current user is involved
  const userFriendships = friendshipsValue?.docs.filter(doc => {
    const data = doc.data();
    return data.user1Id === userId || data.user2Id === userId;
  }) || [];

  // Map friendships to friend data
  const friends = userFriendships.map(doc => {
    const friendship = { id: doc.id, ...doc.data() };
    const friendId = friendship.user1Id === userId ? friendship.user2Id : friendship.user1Id;
    const friendData = usersMap[friendId];
    
    return {
      friendshipId: friendship.id,
      friendId,
      friendData,
      createdAt: friendship.createdAt
    };
  }).filter(friend => friend.friendData); // Only include friends where we have user data

  if (friends.length === 0) {
    return (
      <div className="no-friends">
        <p>You don't have any friends yet.</p>
      </div>
    );
  }

  return (
    <div className="friends-list">
      <h3>Your Friends ({friends.length})</h3>
      <div className="friends-grid">
        {friends.map(friend => (
          <div key={friend.friendshipId} className="friend-card">
            <div className="friend-user">
              {friend.friendData.photoURL ? (
                <img 
                  src={friend.friendData.photoURL} 
                  alt={`${friend.friendData.displayName}'s profile`}
                  className="friend-avatar"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className="friend-avatar-placeholder"
                style={{ display: friend.friendData.photoURL ? 'none' : 'flex' }}
              >
                {friend.friendData.displayName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="friend-info">
                <div className="friend-name">{friend.friendData.displayName}</div>
                <div className="friend-email">{friend.friendData.email}</div>
                <div className="friend-since">Friends since {formatDate(friend.createdAt)}</div>
              </div>
            </div>
            <div className="friend-actions">
              <button 
                onClick={() => handleRemoveFriend(friend.friendshipId, friend.friendData.displayName)}
                className="remove-friend-btn"
              >
                Remove Friend
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FriendsList;

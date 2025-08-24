import React from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where, orderBy, doc, updateDoc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import Header from './header/Header';
import AddFriend from './AddFriend';

const Friends = () => {
  const [user] = useAuthState(auth);

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

  // Get incoming friend requests by userId
  const [incomingByIdValue, incomingByIdLoading, incomingByIdError] = useCollection(
    query(
      collection(db, 'friendRequests'),
      where('toUserId', '==', user?.uid || ''),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    ),
    { snapshotListenOptions: { includeMetadataChanges: true } }
  );

  // Get incoming friend requests by email
  const [incomingByEmailValue, incomingByEmailLoading, incomingByEmailError] = useCollection(
    user ? query(
      collection(db, 'friendRequests'),
      where('toUserEmail', '==', user.email.toLowerCase()),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    ) : null,
    { snapshotListenOptions: { includeMetadataChanges: true } }
  );

  // Get outgoing friend requests
  const [outgoingValue, outgoingLoading, outgoingError] = useCollection(
    query(
      collection(db, 'friendRequests'),
      where('fromUserId', '==', user?.uid || ''),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    ),
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

  const handleAcceptRequest = async (requestId, fromUserId) => {
    try {
      // Update the request status
      await updateDoc(doc(db, 'friendRequests', requestId), {
        status: 'accepted',
        respondedAt: serverTimestamp(),
        toUserId: user.uid // Set toUserId now that the user has joined
      });

      // Create friendship (only if fromUserId exists)
      if (fromUserId) {
        await addDoc(collection(db, 'friendships'), {
          user1Id: fromUserId,
          user2Id: user.uid,
          createdAt: serverTimestamp()
        });
      }

    } catch (error) {
      console.error('Error accepting friend request:', error);
      alert('Failed to accept friend request. Please try again.');
    }
  };

  const handleDeclineRequest = async (requestId) => {
    try {
      await updateDoc(doc(db, 'friendRequests', requestId), {
        status: 'declined',
        respondedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error declining friend request:', error);
      alert('Failed to decline friend request. Please try again.');
    }
  };

  const handleCancelRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to cancel this friend request?')) {
      return;
    }

    try {
      await updateDoc(doc(db, 'friendRequests', requestId), {
        status: 'cancelled',
        respondedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error cancelling friend request:', error);
      alert('Failed to cancel friend request. Please try again.');
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

  if (!user) {
    return <div>Loading...</div>;
  }

  if (friendshipsLoading || usersLoading || incomingByIdLoading || incomingByEmailLoading || outgoingLoading) {
    return (
      <div>
        <Header />
        <div className="main-content">
          <div className="loading">Loading friends...</div>
        </div>
      </div>
    );
  }

  if (friendshipsError || usersError || incomingByIdError || incomingByEmailError || outgoingError) {
    const errorMessage = friendshipsError?.message || usersError?.message || incomingByIdError?.message || incomingByEmailError?.message || outgoingError?.message || '';
    
    return (
      <div>
        <Header />
        <div className="main-content">
          <div className="error">
            {errorMessage.includes('index') || errorMessage.includes('Index') ? (
              <p>Friend system is being set up... Please wait a few minutes and refresh the page.</p>
            ) : (
              <p>Error loading friends.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Create a map of user IDs to user data
  const usersMap = {};
  if (usersValue) {
    usersValue.docs.forEach(doc => {
      usersMap[doc.id] = { id: doc.id, ...doc.data() };
    });
  }

  // Get current friends
  const userFriendships = friendshipsValue?.docs.filter(doc => {
    const data = doc.data();
    return data.user1Id === user.uid || data.user2Id === user.uid;
  }) || [];

  const friends = userFriendships.map(doc => {
    const friendship = { id: doc.id, ...doc.data() };
    const friendId = friendship.user1Id === user.uid ? friendship.user2Id : friendship.user1Id;
    const friendData = usersMap[friendId];
    
    return {
      type: 'friend',
      friendshipId: friendship.id,
      friendId,
      friendData,
      createdAt: friendship.createdAt
    };
  }).filter(friend => friend.friendData);

  // Get incoming requests
  const incomingByIdRequests = incomingByIdValue?.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) || [];

  const incomingByEmailRequests = incomingByEmailValue?.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) || [];

  // Combine and deduplicate incoming requests
  const allIncomingRequests = [...incomingByIdRequests, ...incomingByEmailRequests];
  const incomingRequestsMap = new Map();
  allIncomingRequests.forEach(request => {
    incomingRequestsMap.set(request.id, request);
  });
  const incomingRequests = Array.from(incomingRequestsMap.values())
    .map(request => ({
      type: 'incoming',
      ...request
    }))
    .sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return b.createdAt.seconds - a.createdAt.seconds;
    });

  // Get outgoing requests
  const outgoingRequests = outgoingValue?.docs.map(doc => ({
    type: 'outgoing',
    id: doc.id,
    ...doc.data()
  })) || [];

  // Combine all items and sort by creation date
  const allItems = [...friends, ...incomingRequests, ...outgoingRequests].sort((a, b) => {
    const aTime = a.createdAt?.seconds || 0;
    const bTime = b.createdAt?.seconds || 0;
    return bTime - aTime;
  });

  const friendCount = friends.length;
  const pendingCount = incomingRequests.length + outgoingRequests.length;

  return (
    <div>
      <Header />
      <div className="main-content">
        <div className="friends-container">
          <h2>Friends ({friendCount}) {pendingCount > 0 && `• ${pendingCount} pending`}</h2>
          
          <AddFriend userId={user.uid} />

          {allItems.length === 0 ? (
            <div className="no-friends">
              <p>No friends or pending requests yet. Send a friend request above to get started!</p>
            </div>
          ) : (
            <div className="friends-list">
              {allItems.map(item => {
                if (item.type === 'friend') {
                  return (
                    <div key={`friend-${item.friendshipId}`} className="friend-card">
                      <div className="friend-user">
                        {item.friendData.photoURL ? (
                          <img 
                            src={item.friendData.photoURL} 
                            alt={`${item.friendData.displayName}'s profile`}
                            className="friend-avatar"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className="friend-avatar-placeholder"
                          style={{ display: item.friendData.photoURL ? 'none' : 'flex' }}
                        >
                          {item.friendData.displayName?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="friend-info">
                          <div className="friend-name">{item.friendData.displayName}</div>
                          <div className="friend-email">{item.friendData.email}</div>
                          <div className="friend-since">Friends since {formatDate(item.createdAt)}</div>
                        </div>
                      </div>
                      <div className="friend-actions">
                        <button 
                          onClick={() => handleRemoveFriend(item.friendshipId, item.friendData.displayName)}
                          className="remove-friend-btn"
                        >
                          Remove Friend
                        </button>
                      </div>
                    </div>
                  );
                } else if (item.type === 'incoming') {
                  return (
                    <div key={`incoming-${item.id}`} className="friend-card incoming-request">
                      <div className="friend-user">
                        {item.fromUserPhotoURL ? (
                          <img 
                            src={item.fromUserPhotoURL} 
                            alt={`${item.fromUserName}'s profile`}
                            className="friend-avatar"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className="friend-avatar-placeholder"
                          style={{ display: item.fromUserPhotoURL ? 'none' : 'flex' }}
                        >
                          {item.fromUserName?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="friend-info">
                          <div className="friend-name">Incoming request</div>
                          <div className="friend-email">{item.fromUserEmail}</div>
                          <div className="friend-since">Sent {formatDate(item.createdAt)}</div>
                        </div>
                      </div>
                      <div className="friend-actions">
                        <button 
                          onClick={() => handleAcceptRequest(item.id, item.fromUserId)}
                          className="accept-btn"
                        >
                          Accept
                        </button>
                        <button 
                          onClick={() => handleDeclineRequest(item.id)}
                          className="decline-btn"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  );
                } else if (item.type === 'outgoing') {
                  return (
                    <div key={`outgoing-${item.id}`} className="friend-card outgoing-request">
                      <div className="friend-user">
                        <div className="friend-avatar-placeholder">
                          {item.toUserEmail?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="friend-info">
                          <div className="friend-name">Request sent</div>
                          <div className="friend-email">{item.toUserEmail}</div>
                          <div className="friend-since">Sent {formatDate(item.createdAt)}</div>
                        </div>
                      </div>
                      <div className="friend-actions">
                        <button 
                          onClick={() => handleCancelRequest(item.id)}
                          className="cancel-btn"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Friends;

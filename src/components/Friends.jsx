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
      <div className="bg-[#e4f0f0] dark:bg-[#2b2b2b] min-h-screen">
        <Header />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center py-8 text-gray-600">Loading friends...</div>
        </div>
      </div>
    );
  }

  if (friendshipsError || usersError || incomingByIdError || incomingByEmailError || outgoingError) {
    const errorMessage = friendshipsError?.message || usersError?.message || incomingByIdError?.message || incomingByEmailError?.message || outgoingError?.message || '';
    
    return (
      <div className="bg-[#e4f0f0] dark:bg-[#2b2b2b] min-h-screen">
        <Header />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center py-8 text-red-600">
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
    <div className="bg-[#e4f0f0] dark:bg-[#2b2b2b] min-h-screen">
      <Header />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mx-auto">
          <h2 className="text-2xl font-bold text-[#8b4513] mb-8">Friends ({friendCount}) {pendingCount > 0 && `• ${pendingCount} pending`}</h2>
          
          <AddFriend userId={user.uid} />

          {allItems.length === 0 ? (
            <div className="text-center py-12 text-gray-600 italic">
              <p>No friends or pending requests yet. Send a friend request above to get started!</p>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-lg shadow-sm">
              {allItems.map(item => {
                if (item.type === 'friend') {
                  return (
                    <div key={`friend-${item.friendshipId}`} className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50 flex justify-between items-center">
                      <div className="flex items-center gap-4 flex-1">
                        {item.friendData.photoURL ? (
                          <img 
                            src={item.friendData.photoURL} 
                            alt={`${item.friendData.displayName}'s profile`}
                            className="w-[50px] h-[50px] rounded-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className="w-[50px] h-[50px] rounded-full bg-[#d2691e] flex items-center justify-center font-bold text-white text-xl"
                          style={{ display: item.friendData.photoURL ? 'none' : 'flex' }}
                        >
                          {item.friendData.displayName?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-800">{item.friendData.displayName}</div>
                          <div className="text-sm text-gray-600">{item.friendData.email}</div>
                          <div className="text-xs text-gray-500">Friends since {formatDate(item.createdAt)}</div>
                        </div>
                      </div>
                      <div className="flex justify-end flex-shrink-0">
                        <button 
                          onClick={() => handleRemoveFriend(item.friendshipId, item.friendData.displayName)}
                          className="bg-red-600 hover:bg-red-700 text-white rounded px-4 py-2 text-sm transition-colors"
                        >
                          Remove Friend
                        </button>
                      </div>
                    </div>
                  );
                } else if (item.type === 'incoming') {
                  return (
                    <div key={`incoming-${item.id}`} className="border border-gray-200 border-l-[3px] border-l-green-500 rounded-lg p-4 mb-4 bg-green-50 flex justify-between items-center">
                      <div className="flex items-center gap-4 flex-1">
                        {item.fromUserPhotoURL ? (
                          <img 
                            src={item.fromUserPhotoURL} 
                            alt={`${item.fromUserName}'s profile`}
                            className="w-[50px] h-[50px] rounded-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className="w-[50px] h-[50px] rounded-full bg-[#d2691e] flex items-center justify-center font-bold text-white text-xl"
                          style={{ display: item.fromUserPhotoURL ? 'none' : 'flex' }}
                        >
                          {item.fromUserName?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-800">Incoming request</div>
                          <div className="text-sm text-gray-600">{item.fromUserEmail}</div>
                          <div className="text-xs text-gray-500">Sent {formatDate(item.createdAt)}</div>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end flex-shrink-0">
                        <button 
                          onClick={() => handleAcceptRequest(item.id, item.fromUserId)}
                          className="bg-green-600 hover:bg-green-700 text-white rounded px-4 py-2 text-sm transition-colors"
                        >
                          Accept
                        </button>
                        <button 
                          onClick={() => handleDeclineRequest(item.id)}
                          className="bg-red-600 hover:bg-red-700 text-white rounded px-4 py-2 text-sm transition-colors"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  );
                } else if (item.type === 'outgoing') {
                  return (
                    <div key={`outgoing-${item.id}`} className="border border-gray-200 border-l-[3px] border-l-yellow-500 rounded-lg p-4 mb-4 bg-yellow-50 flex justify-between items-center">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-[50px] h-[50px] rounded-full bg-[#d2691e] flex items-center justify-center font-bold text-white text-xl">
                          {item.toUserEmail?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-800">Request sent</div>
                          <div className="text-sm text-gray-600">{item.toUserEmail}</div>
                          <div className="text-xs text-gray-500">Sent {formatDate(item.createdAt)}</div>
                        </div>
                      </div>
                      <div className="flex justify-end flex-shrink-0">
                        <button 
                          onClick={() => handleCancelRequest(item.id)}
                          className="bg-gray-600 hover:bg-gray-700 text-white rounded px-4 py-2 text-sm transition-colors"
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

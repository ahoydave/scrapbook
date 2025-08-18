import React from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where, orderBy, doc, updateDoc, addDoc, serverTimestamp, or, and } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';

const FriendRequests = ({ userId }) => {
  const [user] = useAuthState(auth);
  
  // Get incoming friend requests by userId
  const [incomingByIdValue, incomingByIdLoading, incomingByIdError] = useCollection(
    query(
      collection(db, 'friendRequests'),
      where('toUserId', '==', userId),
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
      where('fromUserId', '==', userId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    ),
    { snapshotListenOptions: { includeMetadataChanges: true } }
  );

  const handleAcceptRequest = async (requestId, fromUserId) => {
    try {
      // Update the request status
      await updateDoc(doc(db, 'friendRequests', requestId), {
        status: 'accepted',
        respondedAt: serverTimestamp(),
        toUserId: userId // Set toUserId now that the user has joined
      });

      // Create friendship (only if fromUserId exists)
      if (fromUserId) {
        await addDoc(collection(db, 'friendships'), {
          user1Id: fromUserId,
          user2Id: userId,
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

  if (incomingByIdLoading || incomingByEmailLoading || outgoingLoading) {
    return <div className="loading">Loading friend requests...</div>;
  }

  if (incomingByIdError || incomingByEmailError || outgoingError) {
    console.error('Friend requests error:', { incomingByIdError, incomingByEmailError, outgoingError });
    
    // If it's an index error, show a helpful message
    const errorMessage = incomingByIdError?.message || incomingByEmailError?.message || outgoingError?.message || '';
    if (errorMessage.includes('index') || errorMessage.includes('Index')) {
      return (
        <div className="error">
          <p>Friend requests are being set up... Please wait a few minutes and refresh the page.</p>
          <details>
            <summary>Error details</summary>
            <pre>{errorMessage}</pre>
          </details>
        </div>
      );
    }
    
    return (
      <div className="error">
        <p>Error loading friend requests.</p>
        <details>
          <summary>Error details</summary>
          <pre>{errorMessage}</pre>
        </details>
      </div>
    );
  }

  // Combine incoming requests from both queries
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
    .sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return b.createdAt.seconds - a.createdAt.seconds;
    });

  const outgoingRequests = outgoingValue?.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) || [];

  return (
    <div className="friend-requests">
      <div className="requests-section">
        <h3>Incoming Requests</h3>
        {incomingRequests.length === 0 ? (
          <p className="no-requests">No incoming friend requests.</p>
        ) : (
          <div className="requests-list">
            {incomingRequests.map(request => (
              <div key={request.id} className="request-card">
                <div className="request-user">
                  {request.fromUserPhotoURL ? (
                    <img 
                      src={request.fromUserPhotoURL} 
                      alt={`${request.fromUserName}'s profile`}
                      className="request-avatar"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className="request-avatar-placeholder"
                    style={{ display: request.fromUserPhotoURL ? 'none' : 'flex' }}
                  >
                    {request.fromUserName?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="request-info">
                    <div className="request-name">{request.fromUserName}</div>
                    <div className="request-email">{request.fromUserEmail}</div>
                    <div className="request-date">Sent {formatDate(request.createdAt)}</div>
                  </div>
                </div>
                <div className="request-actions">
                  <button 
                    onClick={() => handleAcceptRequest(request.id, request.fromUserId)}
                    className="accept-btn"
                  >
                    Accept
                  </button>
                  <button 
                    onClick={() => handleDeclineRequest(request.id)}
                    className="decline-btn"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="requests-section">
        <h3>Sent Requests</h3>
        {outgoingRequests.length === 0 ? (
          <p className="no-requests">No pending outgoing requests.</p>
        ) : (
          <div className="requests-list">
            {outgoingRequests.map(request => (
              <div key={request.id} className="request-card">
                <div className="request-user">
                  <div className="request-avatar-placeholder">
                    {request.toUserEmail?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="request-info">
                    <div className="request-name">Request sent to {request.toUserEmail}</div>
                    <div className="request-date">Sent {formatDate(request.createdAt)}</div>
                  </div>
                </div>
                <div className="request-actions">
                  <button 
                    onClick={() => handleCancelRequest(request.id)}
                    className="cancel-btn"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendRequests;

import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollection } from 'react-firebase-hooks/firestore';
import {
  collection,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useState } from 'react';

const useFriends = () => {
  const [user] = useAuthState(auth);
  const [processingActions, setProcessingActions] = useState({});

  // Get friendships where user is either user1 or user2
  const [friendshipsValue, friendshipsLoading, friendshipsError] =
    useCollection(
      query(collection(db, 'friendships'), orderBy('createdAt', 'desc')),
      { snapshotListenOptions: { includeMetadataChanges: true } }
    );

  // Get all users to match friend IDs with user info
  const [usersValue, usersLoading, usersError] = useCollection(
    collection(db, 'users'),
    { snapshotListenOptions: { includeMetadataChanges: true } }
  );

  // Get incoming friend requests by userId
  const [incomingByIdValue, incomingByIdLoading, incomingByIdError] =
    useCollection(
      user
        ? query(
            collection(db, 'friendRequests'),
            where('toUserId', '==', user.uid || ''),
            where('status', '==', 'pending'),
            orderBy('createdAt', 'desc')
          )
        : null,
      { snapshotListenOptions: { includeMetadataChanges: true } }
    );

  // Get incoming friend requests by email
  const [incomingByEmailValue, incomingByEmailLoading, incomingByEmailError] =
    useCollection(
      user
        ? query(
            collection(db, 'friendRequests'),
            where('toUserEmail', '==', user.email?.toLowerCase() || ''),
            where('status', '==', 'pending'),
            orderBy('createdAt', 'desc')
          )
        : null,
      { snapshotListenOptions: { includeMetadataChanges: true } }
    );

  // Get outgoing friend requests
  const [outgoingValue, outgoingLoading, outgoingError] = useCollection(
    user
      ? query(
          collection(db, 'friendRequests'),
          where('fromUserId', '==', user.uid || ''),
          where('status', '==', 'pending'),
          orderBy('createdAt', 'desc')
        )
      : null,
    { snapshotListenOptions: { includeMetadataChanges: true } }
  );

  const handleRemoveFriend = async (friendshipId, friendName) => {
    if (
      !window.confirm(
        `Are you sure you want to remove ${friendName} as a friend?`
      )
    ) {
      return;
    }

    setProcessingActions((prev) => ({ ...prev, [friendshipId]: true }));

    try {
      await deleteDoc(doc(db, 'friendships', friendshipId));
      // TODO?: Handle success
    } catch (error) {
      console.error('Error removing friend:', error);
      alert('Failed to remove friend. Please try again.');
    } finally {
      setProcessingActions((prev) => ({ ...prev, [friendshipId]: false }));
    }
  };

  const handleAcceptRequest = async (requestId, fromUserId) => {
    setProcessingActions((prev) => ({ ...prev, [requestId]: true }));

    try {
      // Update the request status
      await updateDoc(doc(db, 'friendRequests', requestId), {
        status: 'accepted',
        respondedAt: serverTimestamp(),
        toUserId: user.uid, // Set toUserId now that the user has joined
      });

      // Create friendship (only if fromUserId exists)
      if (fromUserId) {
        await addDoc(collection(db, 'friendships'), {
          user1Id: fromUserId,
          user2Id: user.uid,
          createdAt: serverTimestamp(),
        });
      }
      // TODO?: Handle success
    } catch (error) {
      console.error('Error accepting friend request:', error);
      alert('Failed to accept friend request. Please try again.');
    } finally {
      setProcessingActions((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  const handleDeclineRequest = async (requestId) => {
    setProcessingActions((prev) => ({ ...prev, [requestId]: true }));

    try {
      await updateDoc(doc(db, 'friendRequests', requestId), {
        status: 'declined',
        respondedAt: serverTimestamp(),
      });
      // TODO?: Handle success
    } catch (error) {
      console.error('Error declining friend request:', error);
      alert('Failed to decline friend request. Please try again.');
    } finally {
      setProcessingActions((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  const handleCancelRequest = async (requestId) => {
    if (
      !window.confirm('Are you sure you want to cancel this friend request?')
    ) {
      return;
    }

    setProcessingActions((prev) => ({ ...prev, [requestId]: true }));

    try {
      await updateDoc(doc(db, 'friendRequests', requestId), {
        status: 'cancelled',
        respondedAt: serverTimestamp(),
      });
      // TODO?: Handle success
    } catch (error) {
      console.error('Error cancelling friend request:', error);
      alert('Failed to cancel friend request. Please try again.');
    } finally {
      setProcessingActions((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  // Process data
  const processData = () => {
    // Create a map of user IDs to user data
    const usersMap = {};
    if (usersValue) {
      usersValue.docs.forEach((doc) => {
        usersMap[doc.id] = { id: doc.id, ...doc.data() };
      });
    }

    // Get current friends
    const userFriendships =
      friendshipsValue?.docs.filter((doc) => {
        const data = doc.data();
        return data.user1Id === user?.uid || data.user2Id === user?.uid;
      }) || [];

    const friends = userFriendships
      .map((doc) => {
        const friendship = { id: doc.id, ...doc.data() };
        const friendId =
          friendship.user1Id === user?.uid
            ? friendship.user2Id
            : friendship.user1Id;
        const friendData = usersMap[friendId];

        return {
          type: 'friend',
          friendshipId: friendship.id,
          friendId,
          friendData,
          createdAt: friendship.createdAt,
        };
      })
      .filter((friend) => friend.friendData);

    // Get incoming requests
    const incomingByIdRequests =
      incomingByIdValue?.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) || [];

    const incomingByEmailRequests =
      incomingByEmailValue?.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) || [];

    // Combine and deduplicate incoming requests
    const allIncomingRequests = [
      ...incomingByIdRequests,
      ...incomingByEmailRequests,
    ];
    const incomingRequestsMap = new Map();
    allIncomingRequests.forEach((request) => {
      incomingRequestsMap.set(request.id, request);
    });
    const incomingRequests = Array.from(incomingRequestsMap.values())
      .map((request) => ({
        type: 'incoming',
        ...request,
      }))
      .sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.seconds - a.createdAt.seconds;
      });

    // Get outgoing requests
    const outgoingRequests =
      outgoingValue?.docs.map((doc) => ({
        type: 'outgoing',
        id: doc.id,
        ...doc.data(),
      })) || [];

    // Combine all items and sort by creation date
    const allItems = [
      ...friends,
      ...incomingRequests,
      ...outgoingRequests,
    ].sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime;
    });

    const friendCount = friends.length;
    const pendingCount = incomingRequests.length + outgoingRequests.length;

    return {
      friends,
      incomingRequests,
      outgoingRequests,
      allItems,
      friendCount,
      pendingCount,
      usersMap,
    };
  };

  const isLoading =
    !user ||
    friendshipsLoading ||
    usersLoading ||
    incomingByIdLoading ||
    incomingByEmailLoading ||
    outgoingLoading;
  const error =
    friendshipsError ||
    usersError ||
    incomingByIdError ||
    incomingByEmailError ||
    outgoingError;
  const errorMessage = error?.message || '';

  const data = !isLoading && !error ? processData() : null;

  return {
    user,
    isLoading,
    error,
    errorMessage,
    data,
    processingActions,
    handlers: {
      handleRemoveFriend,
      handleAcceptRequest,
      handleDeclineRequest,
      handleCancelRequest,
    },
  };
};

export default useFriends;

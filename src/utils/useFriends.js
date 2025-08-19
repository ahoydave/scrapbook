import { useState, useEffect } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';

export const useFriends = (user) => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get friendships and users with real-time updates
  const [friendshipsValue, friendshipsLoading, friendshipsError] = useCollection(
    user ? query(collection(db, 'friendships'), orderBy('createdAt', 'desc')) : null,
    { snapshotListenOptions: { includeMetadataChanges: true } }
  );

  const [usersValue, usersLoading, usersError] = useCollection(
    user ? collection(db, 'users') : null,
    { snapshotListenOptions: { includeMetadataChanges: true } }
  );

  useEffect(() => {
    if (!user) {
      setFriends([]);
      setLoading(false);
      return;
    }

    if (friendshipsLoading || usersLoading) {
      setLoading(true);
      return;
    }

    if (friendshipsError || usersError) {
      console.error('Error loading friends:', friendshipsError || usersError);
      setFriends([]);
      setLoading(false);
      return;
    }

    try {
      // Create a map of user IDs to user data
      const usersMap = {};
      if (usersValue) {
        usersValue.docs.forEach(doc => {
          usersMap[doc.id] = { id: doc.id, ...doc.data() };
        });
      }

      // Get current user's friendships
      const userFriendships = friendshipsValue?.docs.filter(doc => {
        const data = doc.data();
        return data.user1Id === user.uid || data.user2Id === user.uid;
      }) || [];

      // Map friendships to friend data
      const friendsList = userFriendships.map(doc => {
        const friendship = { id: doc.id, ...doc.data() };
        const friendId = friendship.user1Id === user.uid ? friendship.user2Id : friendship.user1Id;
        const friendData = usersMap[friendId];
        
        return {
          id: friendId,
          displayName: friendData?.displayName || friendData?.email || 'Unknown',
          email: friendData?.email,
          photoURL: friendData?.photoURL,
          createdAt: friendship.createdAt
        };
      }).filter(friend => friend.displayName !== 'Unknown'); // Only include friends where we have user data

      setFriends(friendsList);
    } catch (error) {
      console.error('Error processing friends:', error);
      setFriends([]);
    } finally {
      setLoading(false);
    }
  }, [user, friendshipsValue, usersValue, friendshipsLoading, usersLoading, friendshipsError, usersError]);

  return { friends, loading, error: friendshipsError || usersError };
};

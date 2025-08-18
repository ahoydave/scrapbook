import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { getUserByEmail } from '../utils/userProfile';

const AddFriend = ({ userId }) => {
  const [user] = useAuthState(auth);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  const handleSendRequest = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setMessage('Please enter an email address');
      setMessageType('error');
      return;
    }

    if (email.toLowerCase() === user.email.toLowerCase()) {
      setMessage('You cannot send a friend request to yourself');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const targetEmail = email.trim().toLowerCase();

      // Check if request already exists to this email
      const requestsRef = collection(db, 'friendRequests');
      const existingRequestQuery = query(
        requestsRef,
        where('fromUserId', '==', userId),
        where('toUserEmail', '==', targetEmail),
        where('status', '==', 'pending')
      );
      const existingRequestSnapshot = await getDocs(existingRequestQuery);

      if (!existingRequestSnapshot.empty) {
        setMessage('Friend request already sent to this email address');
        setMessageType('error');
        setLoading(false);
        return;
      }

      // Check if there's a pending request from this email to us
      const reverseRequestQuery = query(
        requestsRef,
        where('fromUserEmail', '==', targetEmail),
        where('toUserId', '==', userId),
        where('status', '==', 'pending')
      );
      const reverseRequestSnapshot = await getDocs(reverseRequestQuery);

      if (!reverseRequestSnapshot.empty) {
        setMessage('This user has already sent you a friend request! Check your Friend Requests tab.');
        setMessageType('error');
        setLoading(false);
        return;
      }

      // Check if user exists and if they're already friends
      const targetUser = await getUserByEmail(targetEmail);
      if (targetUser) {
        // Check if they're already friends
        const friendshipsRef = collection(db, 'friendships');
        
        // Check both directions since friendships are bidirectional
        const friendshipQuery1 = query(
          friendshipsRef,
          where('user1Id', '==', userId),
          where('user2Id', '==', targetUser.id)
        );
        const friendshipQuery2 = query(
          friendshipsRef,
          where('user1Id', '==', targetUser.id),
          where('user2Id', '==', userId)
        );
        
        const [snapshot1, snapshot2] = await Promise.all([
          getDocs(friendshipQuery1),
          getDocs(friendshipQuery2)
        ]);
        
        const isAlreadyFriend = !snapshot1.empty || !snapshot2.empty;

        if (isAlreadyFriend) {
          setMessage('You are already friends with this user');
          setMessageType('error');
          setLoading(false);
          return;
        }
      }

      // Send friend request (works whether user exists or not)
      await addDoc(collection(db, 'friendRequests'), {
        fromUserId: userId,
        toUserId: targetUser?.id || null, // null if user doesn't exist yet
        toUserEmail: targetEmail,
        fromUserName: user.displayName || 'Anonymous',
        fromUserEmail: user.email.toLowerCase(),
        fromUserPhotoURL: user.photoURL || null,
        status: 'pending',
        createdAt: serverTimestamp(),
        respondedAt: null
      });

      setMessage(`Friend request sent to ${targetEmail}!`);
      setMessageType('success');
      setEmail('');
      
    } catch (error) {
      console.error('Error sending friend request:', error);
      setMessage('Failed to send friend request. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-friend">
      <h3>Add a Friend</h3>
      
      <form onSubmit={handleSendRequest} className="add-friend-form">
        <div className="form-group">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email address"
            className="email-input"
            disabled={loading}
          />
          <button 
            type="submit" 
            disabled={loading || !email.trim()}
            className="send-request-btn"
          >
            {loading ? 'Sending...' : 'Send Friend Request'}
          </button>
        </div>
      </form>

      {message && (
        <div className={`message ${messageType}`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default AddFriend;

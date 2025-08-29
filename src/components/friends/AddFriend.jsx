import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../firebase';
import { getUserByEmail } from '../../utils/userProfile';

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
    <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
      <h3 className="text-xl font-semibold text-[#8b4513] mb-4">Add a Friend</h3>
      
      <form onSubmit={handleSendRequest} className="mb-4">
        <div className="flex gap-4 items-center">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email address"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8b4513] focus:ring-opacity-20 focus:border-[#8b4513]"
            disabled={loading}
          />
          <button 
            type="submit" 
            disabled={loading || !email.trim()}
            className="bg-[#8b4513] hover:bg-[#a0522d] disabled:bg-gray-400 text-white rounded-md px-6 py-2 font-semibold text-base transition-colors disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send Friend Request'}
          </button>
        </div>
      </form>

      {message && (
        <div className={`p-4 rounded-md ${
          messageType === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default AddFriend;

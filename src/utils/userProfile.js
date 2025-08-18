import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Creates or updates a user profile in Firestore
 * This should be called whenever a user logs in
 */
export const createOrUpdateUserProfile = async (user) => {
  if (!user) return;

  const userRef = doc(db, 'users', user.uid);
  
  try {
    // Check if user profile already exists
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      // Update last login time
      await setDoc(userRef, {
        lastLoginAt: serverTimestamp()
      }, { merge: true });
    } else {
      // Create new user profile
      await setDoc(userRef, {
        email: user.email.toLowerCase(),
        displayName: user.displayName || 'Anonymous',
        photoURL: user.photoURL || null,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error creating/updating user profile:', error);
  }
};

/**
 * Get a user profile by email address
 */
export const getUserByEmail = async (email) => {
  // Note: This requires a Firestore index on the email field
  // For now, we'll implement a simple approach that might be slower
  // In production, you'd want to create an index on the email field
  
  try {
    const { collection, query, where, getDocs } = await import('firebase/firestore');
    
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email.toLowerCase()));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      return {
        id: userDoc.id,
        ...userDoc.data()
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error finding user by email:', error);
    return null;
  }
};

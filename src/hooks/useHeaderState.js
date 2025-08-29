import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where } from 'firebase/firestore';
import { auth, db } from '../firebase';

export const useHeaderState = () => {
  const [user, loading] = useAuthState(auth);

  const [incomingByIdValue] = useCollection(
    user
      ? query(
          collection(db, 'friendRequests'),
          where('toUserId', '==', user.uid),
          where('status', '==', 'pending')
        )
      : null,
    { snapshotListenOptions: { includeMetadataChanges: true } }
  );

  const [incomingByEmailValue] = useCollection(
    user
      ? query(
          collection(db, 'friendRequests'),
          where('toUserEmail', '==', user.email.toLowerCase()),
          where('status', '==', 'pending')
        )
      : null,
    { snapshotListenOptions: { includeMetadataChanges: true } }
  );

  const getIncomingRequestsCount = () => {
    if (!user) return 0;

    const incomingByIdRequests = incomingByIdValue?.docs || [];
    const incomingByEmailRequests = incomingByEmailValue?.docs || [];

    const allIncomingRequests = [
      ...incomingByIdRequests,
      ...incomingByEmailRequests,
    ];
    const incomingRequestsMap = new Map();
    allIncomingRequests.forEach((doc) => {
      incomingRequestsMap.set(doc.id, doc);
    });

    return incomingRequestsMap.size;
  };

  const incomingCount = getIncomingRequestsCount();

  const getUserDisplayInfo = () => {
    if (!user) return { displayName: '', photoURL: '', initial: '' };

    return {
      displayName: user.displayName || user.email,
      photoURL: user.photoURL,
      initial:
        user.displayName?.charAt(0)?.toUpperCase() ||
        user.email?.charAt(0)?.toUpperCase() ||
        'U',
    };
  };

  const userDisplayInfo = getUserDisplayInfo();

  return {
    user,
    loading,
    incomingCount,
    userDisplayInfo,
  };
};

# Scrapbook Data Schema

This document describes the Firestore database structure for the Scrapbook social platform.

## Collections Overview

The app uses 6 main Firestore collections:
- `users` - User profile information
- `posts` - User posts with media
- `comments` - Comments on posts
- `reactions` - Emoji reactions on posts and comments
- `friendships` - Confirmed bidirectional friendships
- `friendRequests` - Pending/completed friend requests

## Detailed Schema

### 1. users
Stores user profile information for friend lookups and management.
```javascript
{
  id: string (userId from Firebase Auth),
  email: string (lowercase),
  displayName: string,
  photoURL: string | null,
  createdAt: timestamp,
  lastLoginAt: timestamp
}
```

### 2. posts
Stores user posts with optional media attachments.
```javascript
{
  id: string (auto-generated),
  userId: string,
  userDisplayName: string,
  userPhotoURL: string | null,
  content: string,
  mediaURL: string | null,
  mediaType: "image" | "video" | null,
  createdAt: timestamp,
  updatedAt: timestamp | null,
  edited: boolean
}
```

### 3. comments
Stores comments on posts with author information.
```javascript
{
  id: string (auto-generated),
  postId: string,
  userId: string,
  userDisplayName: string,
  userPhotoURL: string | null,
  content: string,
  createdAt: timestamp
}
```

### 4. reactions
Stores emoji reactions on posts and comments.
```javascript
{
  id: string (auto-generated),
  targetType: "post" | "comment",
  targetId: string, // postId or commentId
  userId: string,
  userDisplayName: string,
  emoji: string, // The emoji character (e.g., "👍", "❤️", "😂")
  createdAt: timestamp
}
```

**Note**: Each reaction is a separate document. This allows users to add multiple different emoji reactions to the same post/comment. To prevent duplicate reactions of the same emoji from the same user, we'll use a composite key check in the application logic.

### 5. friendships
Stores confirmed bidirectional friendships.
```javascript
{
  id: string (auto-generated),
  user1Id: string,
  user2Id: string,
  createdAt: timestamp
}
```

**Note**: Each friendship is stored as one document with both user IDs. Queries check both `user1Id` and `user2Id` fields to find friendships for a user.

### 6. friendRequests
Stores pending and completed friend requests.
```javascript
{
  id: string (auto-generated),
  fromUserId: string,
  toUserId: string | null, // null if target user hasn't joined yet
  toUserEmail: string, // always present for email-based lookups
  fromUserName: string,
  fromUserEmail: string,
  fromUserPhotoURL: string | null,
  status: "pending" | "accepted" | "declined" | "cancelled",
  createdAt: timestamp,
  respondedAt: timestamp | null
}
```

**Note**: The `toUserEmail` field enables sending friend requests to users who haven't joined the app yet. When they join and their email matches, they'll see the pending request.

## Query Patterns

### Common Queries

**Get user's friends:**
```javascript
// Query friendships where user is either user1 or user2
const friendships = await getDocs(collection(db, 'friendships'));
const userFriends = friendships.docs.filter(doc => {
  const data = doc.data();
  return data.user1Id === userId || data.user2Id === userId;
});
```

**Get posts from friends:**
```javascript
// Get posts where userId is in array of friend IDs
const posts = query(
  collection(db, 'posts'),
  where('userId', 'in', friendIds),
  orderBy('createdAt', 'desc')
);
```

**Get incoming friend requests:**
```javascript
// Requests sent to user ID or email
const requests = query(
  collection(db, 'friendRequests'),
  and(
    where('status', '==', 'pending'),
    or(
      where('toUserId', '==', userId),
      where('toUserEmail', '==', userEmail)
    )
  )
);
```

**Get comments for a post:**
```javascript
const comments = query(
  collection(db, 'comments'),
  where('postId', '==', postId),
  orderBy('createdAt', 'asc')
);
```

**Get reactions for a post:**
```javascript
const reactions = query(
  collection(db, 'reactions'),
  where('targetType', '==', 'post'),
  where('targetId', '==', postId),
  orderBy('createdAt', 'desc')
);
```

**Get reactions for a comment:**
```javascript
const reactions = query(
  collection(db, 'reactions'),
  where('targetType', '==', 'comment'),
  where('targetId', '==', commentId),
  orderBy('createdAt', 'desc')
);
```

### Required Firestore Indexes

The following composite indexes are required:

1. **comments**: `postId` (ASC) + `createdAt` (ASC)
2. **reactions**: `targetType` (ASC) + `targetId` (ASC) + `createdAt` (DESC)
3. **reactions**: `targetType` (ASC) + `targetId` (ASC) + `userId` (ASC) + `emoji` (ASC)
4. **friendRequests**: `toUserId` (ASC) + `status` (ASC) + `createdAt` (DESC)
5. **friendRequests**: `fromUserId` (ASC) + `status` (ASC) + `createdAt` (DESC)
6. **friendRequests**: `toUserEmail` (ASC) + `status` (ASC) + `createdAt` (DESC)
7. **friendRequests**: `fromUserId` (ASC) + `toUserEmail` (ASC) + `status` (ASC)
8. **friendRequests**: `fromUserEmail` (ASC) + `status` (ASC)

## Security Rules

The app uses Firestore security rules to control data access:

- **users**: Users can read all profiles, create/update their own
- **posts**: Currently permissive (allow all authenticated users)
- **comments**: Users can read all comments, create/edit/delete their own
- **reactions**: Users can read all reactions, create/delete their own
- **friendships**: Users can read/create/delete friendships they're part of
- **friendRequests**: Users can read requests involving them, create from themselves, update requests sent to them

## Data Relationships

```
User (1) ←→ (M) Posts
User (1) ←→ (M) Comments
User (1) ←→ (M) Reactions
User (M) ←→ (M) Users (via friendships)
Post (1) ←→ (M) Comments
Post (1) ←→ (M) Reactions
Comment (1) ←→ (M) Reactions
User (1) ←→ (M) FriendRequests (as sender)
User (1) ←→ (M) FriendRequests (as recipient)
```

This schema supports a complete social platform with user authentication, content creation, friend management, and real-time interactions.
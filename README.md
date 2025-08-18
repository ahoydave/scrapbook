# Scrapbook

A simple, secure social platform for a closed group of users, inspired by the early days of Facebook.

## 🚀 Live App

Visit the deployed app at: **https://crapbook-42b77.web.app**

## 🛠 Technology Stack

- **Frontend**: React with Vite
- **Authentication**: Firebase Auth (Google Sign-In)
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage (images and videos)
- **Hosting**: Firebase Hosting
- **Routing**: React Router DOM
- **State Management**: react-firebase-hooks

## ✨ Current Features

- **Google Authentication**: Sign in with your Google account
- **User Profiles**: Automatic profile creation with Google account info
- **Posts & Timeline**: Create, edit, delete, and view posts with text, images, and videos
- **Post Management**: Edit your own posts with inline editing and delete with confirmation
- **Edit Tracking**: Visual "edited" indicators with timestamps for modified posts
- **Media Uploads**: Upload images (JPEG, PNG, GIF, WebP) and videos (MP4, WebM, MOV)
- **Private Timeline**: Live timeline updates with posts from you and your friends only
- **Friend System**: Send friend requests by email, manage friendships, and private timeline filtering
- **Friend Management**: Add friends, accept/decline requests, remove friendships, and cancel sent requests
- **Comment System**: Comment on any post with real-time updates, delete your own comments, and Facebook-inspired UI
- **File Management**: Automatic file validation, progress tracking, and complete storage cleanup
- **Responsive Design**: Clean, modern UI inspired by Facebook
- **Protected Routes**: Authentication-required pages

## 🏃‍♂️ Development

### Prerequisites
- Node.js (v16 or higher)
- Firebase CLI
- Google account for authentication

### Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Deploy to Firebase
firebase deploy
```

### Firebase Configuration
The app uses Firebase for authentication and hosting. The Firebase project ID is `crapbook-42b77`.

## 📋 Roadmap

See [PROGRESS.md](./PROGRESS.md) for detailed development progress and upcoming features.

## 🔐 Security

- Google OAuth 2.0 authentication
- Firestore security rules protect user data
- Firebase Storage rules restrict file uploads to authenticated users
- Protected routes ensure authenticated access
- File type and size validation for uploads

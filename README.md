# Scrapbook

A simple, secure social platform for a closed group of users, inspired by the early days of Facebook.

## 🚀 Live App

Visit the deployed app at: **https://crapbook-42b77.web.app**

## 🛠 Technology Stack

- **Frontend**: React with Vite
- **Authentication**: Firebase Auth (Google Sign-In)
- **Database**: Firebase Firestore
- **Hosting**: Firebase Hosting
- **Routing**: React Router DOM
- **State Management**: react-firebase-hooks

## ✨ Current Features

- **Google Authentication**: Sign in with your Google account
- **User Profiles**: Automatic profile creation with Google account info
- **Responsive Design**: Clean, modern UI inspired by Facebook
- **Protected Routes**: Authentication-required pages
- **Profile Display**: Shows user's Google profile photo and information

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
- Protected routes ensure authenticated access

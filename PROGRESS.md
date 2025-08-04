# Crapbook Project Summary and Progress

This document outlines the project goals, technology stack, and the progress made so far on the "Crapbook" web application.

## 1. Project Overview

**Crapbook** is a simplified web application inspired by the early days of Facebook. The core idea is to create a small, secure, and simple social platform for a closed group of users.

### Core Principles
*   **Simplicity:** The code and implementation are designed to be as straightforward as possible.
*   **Security:** The application is built with security in mind, particularly regarding user data and access control.

## 2. Technology Stack

*   **Frontend:** React with Vite
*   **Backend:** Firebase
    *   **Authentication:** For user login and session management.
    *   **Firestore:** As the NoSQL database for storing user data, posts, comments, etc.
    *   **Storage:** For hosting user-uploaded images.
*   **Routing:** `react-router-dom`
*   **State Management:** `react-firebase-hooks` for simplified Firebase state management in React components.

## 3. Core Features

*   **User & Friend Management:**
    *   **Invite-Only Sign-up:** New users can only join if invited by an existing user via email.
    *   **Friend Requests:** Friendships are mutual and require a request and acceptance.
    *   **Admin User Creation:** A command-line script exists for an administrator to create the initial users.
*   **Timeline & Content:**
    *   **Posts:** Users can create text posts with an optional image.
    *   **Timeline:** A central feed displaying posts from the user and their friends in chronological order.
    *   **User Profile:** A dedicated page to view a single friend's posts.
    *   **Comments & Reactions:** Users can comment and add emoji reactions to posts and comments.

## 4. Progress Summary (As of 2025-08-04)

### ✅ 1. Project Setup & Configuration
*   Initialized a React + Vite project.
*   Installed core npm dependencies: `firebase`, `react-router-dom`, and `react-firebase-hooks`.
*   Created the Firebase configuration file (`src/firebase.js`).
*   Defined security rules for Firestore (`firestore.rules`) and Storage (`storage.rules`).
*   Created `firebase.json` to link the project to the rules files.

### ✅ 2. Admin User Creation
*   Set up a dedicated `admin-scripts` directory.
*   Created a Node.js script (`create-user.js`) using the `firebase-admin` SDK to allow an administrator to create new users from the command line.
*   Added a separate `package.json` for the admin script's dependencies.

### ✅ 3. Authentication & Routing
*   Created basic UI components for authentication:
    *   `src/components/Login.jsx`
    *   `src/components/SignUp.jsx` (placeholder for invite-based sign-up)
*   Implemented a `src/components/PrivateRoute.jsx` component to protect routes that require a logged-in user.
*   Set up the main application routing in `src/App.jsx` to handle public (`/login`, `/signup`) and private (`/`, `/profile/:userId`) routes.
*   Created placeholder components for `Home` and `Profile` pages.

## 5. Next Steps

*   Complete the user invite and sign-up flow.
*   Implement the friend request system (sending, accepting, declining).
*   Build the functionality for creating and displaying posts on the timeline.
*   Develop the user profile page to show a user's posts.
*   Add the ability to create comments and emoji reactions on posts.

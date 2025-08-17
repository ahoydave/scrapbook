import React from 'react';
import { Navigate } from 'react-router-dom';

const SignUp = () => {
  // Since we're using Google auth, redirect signup to login
  return <Navigate to="/login" replace />;
};

export default SignUp;

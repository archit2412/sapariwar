import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '../firebase'; // Import the auth instance from your firebase.js

// Create the AuthContext
const AuthContext = createContext();

// Custom hook to use the AuthContext
export function useAuth() {
  return useContext(AuthContext);
}

// AuthProvider component
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true); // To handle initial auth state check

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false); // Auth state check is complete
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  // Sign out function
  const logout = () => {
    return firebaseSignOut(auth);
  };

  // The value provided to consuming components
  const value = {
    currentUser,
    loading, // Consumers might want to know if auth state is still loading
    logout,
    // We will add login and signup functions here later
  };

  // Don't render children until loading is false to prevent flicker or premature route access
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}   
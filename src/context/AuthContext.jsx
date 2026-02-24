import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import { useNavigate } from "react-router-dom";
import { useLoading } from "./LoadingContext";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);     // Firebase user
  const navigate = useNavigate();
  const { hideLoading } = useLoading();
  const [authReady, setAuthReady] = useState(false);

  // 🔐 Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser || null);
      setAuthReady(true);
      setTimeout(() => {
        hideLoading();
      }, 200);
    });

    return () => unsubscribe();
  }, []);

  // 🔓 Logout
  const logout = async () => {
    await signOut(auth);
    setUser(null);
    navigate("/login", { replace: true });
  };

  return (
    <AuthContext.Provider value={{ user, logout, authReady }}>
      { children}
    </AuthContext.Provider>
  );
};

// Optional helper hook
export const useAuth = () => useContext(AuthContext);

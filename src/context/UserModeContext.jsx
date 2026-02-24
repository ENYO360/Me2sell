import { createContext, useContext, useEffect, useState } from "react";

const ModeContext = createContext();

export const useMode = () => useContext(ModeContext);

export const ModeProvider = ({ children }) => {
  const [mode, setMode] = useState("seller"); // "seller" | "buyer"

  // 🔹 Load saved mode
  useEffect(() => {
    const savedMode = localStorage.getItem("salesbook-mode");
    if (savedMode) setMode(savedMode);
  }, []);

  // 🔹 Persist mode
  useEffect(() => {
    localStorage.setItem("salesbook-mode", mode);
  }, [mode]);

  const toggleMode = () => {
    setMode((prev) => (prev === "seller" ? "buyer" : "seller"));
  };

  const value = {
    mode,
    isSeller: mode === "seller",
    isBuyer: mode === "buyer",
    setSeller: () => setMode("seller"),
    setBuyer: () => setMode("buyer"),
    toggleMode,
  };

  return (
    <ModeContext.Provider value={value}>
      {children}
    </ModeContext.Provider>
  );
};
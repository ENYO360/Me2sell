import { createContext, useContext, useEffect, useState } from "react";

const NetworkContext = createContext();

export const NetworkProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState("unknown");

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    const connection =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;

    if (connection) {
      const updateConnection = () =>
        setConnectionType(connection.effectiveType);

      updateConnection();
      connection.addEventListener("change", updateConnection);

      return () => {
        connection.removeEventListener("change", updateConnection);
      };
    }

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  return (
    <NetworkContext.Provider
      value={{
        isOnline,
        isSlow: connectionType === "2g" || connectionType === "slow-2g",
        connectionType,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => useContext(NetworkContext);

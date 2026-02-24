import { createContext, useContext, useState } from "react";

const LoadingContext = createContext();

export const useLoading = () => useContext(LoadingContext);

export const LoadingProvider = ({ children }) => {
  const [loading, setLoading] = useState(true); // true on refresh

  const showLoading = () => setLoading(true);
  const hideLoading = () => setLoading(false);

  return (
    <LoadingContext.Provider
      value={{ loading, showLoading, hideLoading }}
    >
      {children}
    </LoadingContext.Provider>
  );
};

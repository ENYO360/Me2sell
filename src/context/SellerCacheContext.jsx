import { createContext, useContext, useRef } from "react";

const SellerCacheContext = createContext();

export const SellerCacheProvider = ({ children }) => {
  const cacheRef = useRef({});

  return (
    <SellerCacheContext.Provider value={cacheRef.current}>
      {children}
    </SellerCacheContext.Provider>
  );
};

export const useSellerCache = () => useContext(SellerCacheContext);

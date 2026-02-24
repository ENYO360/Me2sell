import { createContext, useContext, useState } from "react";

const SearchContext = createContext();

export const SearchProvider = ({ children }) => {
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState("all-products"); // default
  const [results, setResults] = useState([]);

  return (
    <SearchContext.Provider value={{ query, setQuery, scope, setScope, results, setResults }}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => useContext(SearchContext);

import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase/config";
import { doc, getDoc } from "firebase/firestore";

const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState({
    name: "",
    symbol: "",
    loading: true,
  });

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setCurrency({ name: "", symbol: "", loading: false });
        localStorage.removeItem("currency");
        return;
      }

      // ✅ Load from cache immediately
      const cached = localStorage.getItem("currency");
      if (cached) {
        setCurrency({ ...JSON.parse(cached), loading: false });
      }

      // ✅ One-time Firestore read (LOW COST)
      const profileRef = doc(db, "businessProfiles", user.uid);
      const snap = await getDoc(profileRef);

      if (!snap.exists()) return;

      const liveCurrency = snap.data()?.business?.currency;
      if (!liveCurrency) return;

      const newCurrency = {
        name: liveCurrency.name,
        symbol: liveCurrency.symbol,
        loading: false,
      };

      setCurrency(newCurrency);
      localStorage.setItem("currency", JSON.stringify(newCurrency));
    });

    return () => unsubscribeAuth();
  }, []);

  return (
    <CurrencyContext.Provider value={{ currency }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);

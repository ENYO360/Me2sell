import { createContext, useContext, useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase/config";

const MetaContext = createContext();

export const MetaProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setCategories([]);
        setDepartments([]);
        setLoading(false);
        return;
      }

      const uid = user.uid;

      // 🔹 Try localStorage first (FREE)
      const cachedCategories = localStorage.getItem("categories");
      const cachedDepartments = localStorage.getItem("departments");

      if (cachedCategories && cachedDepartments) {
        setCategories(JSON.parse(cachedCategories));
        setDepartments(JSON.parse(cachedDepartments));
        setLoading(false);
        return;
      }

      // 🔥 Firestore read (ONCE)
      try {
        const [catSnap, deptSnap] = await Promise.all([
          getDocs(collection(db, "categories", uid, "userCategories")),
          getDocs(collection(db, "departments", uid, "userDepartments")),
        ]);

        const cats = catSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        const depts = deptSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        setCategories(cats);
        setDepartments(depts);

        // Cache (FREE)
        localStorage.setItem("categories", JSON.stringify(cats));
        localStorage.setItem("departments", JSON.stringify(depts));
      } catch (err) {
        console.error("Meta fetch error:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  return (
    <MetaContext.Provider
      value={{
        categories,
        departments,
        loading,
        setCategories,
        setDepartments,
      }}
    >
      {children}
    </MetaContext.Provider>
  );
};

export const useMeta = () => useContext(MetaContext);

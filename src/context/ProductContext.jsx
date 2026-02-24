import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { collection, getDocs, doc, getDoc, } from "firebase/firestore";
import { auth, db } from "../firebase/config";

const ProductContext = createContext();
export const useProducts = () => useContext(ProductContext);

const CACHE_KEY = "products_cache_v1";
const PROFILE_CACHE = "business_profile_cache_v1";

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  /* ======================
     🧠 LOAD FROM CACHE FIRST
     ====================== */
  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      setProducts(JSON.parse(cached));
      setLoading(false);
    }

    // Profile
    const cachedProfile = localStorage.getItem(PROFILE_CACHE);
    if (cachedProfile) {
      setProfile(JSON.parse(cachedProfile));
      setLoadingProfile(false);
    }
  }, []);

  /* ======================
     🔄 FETCH ONCE FROM FIRESTORE
     ====================== */
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setProducts([]);
        setProfile(null);

        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(PROFILE_CACHE);

        setLoading(false);
        setLoadingProfile(false);

        return;
      }

      try {
        const snap = await getDocs(
          collection(db, "products", user.uid, "productList")
        );

        const list = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        setProducts(list);
        localStorage.setItem(CACHE_KEY, JSON.stringify(list));

        /* ===== PROFILE ===== */

        const profileRef = doc(
          db,
          "businessProfiles",
          user.uid
        );

        const profileSnap = await getDoc(profileRef);

        if (profileSnap.exists()) {
          const profileData = {
            id: profileSnap.id,
            ...profileSnap.data(),
          };

          setProfile(profileData);

          localStorage.setItem(
            PROFILE_CACHE,
            JSON.stringify(profileData)
          );
        }
      } catch (err) {
        console.error("Failed to fetch products", err);
      } finally {
        setLoading(false);
        setLoadingProfile(false);
      }
    });

    return () => unsub();
  }, []);

  /* ======================
     🔍 FILTER HELPERS (ZERO READS)
     ====================== */

  const getProductsByDepartment = useCallback(
    (departmentId) =>
      products.filter((p) => p.departmentId === departmentId),
    [products]
  );

  const getProductsByCategory = useCallback(
    (categoryId) =>
      products.filter((p) => p.categoryId === categoryId),
    [products]
  );

  /* ======================
     📦 CONTEXT VALUE
     ====================== */

  const value = useMemo(
    () => ({
      products,
      loading,
      getProductsByDepartment,
      getProductsByCategory,
      profile,
      loadingProfile,
    }),
    [products, loading, profile, getProductsByDepartment, getProductsByCategory, profile, loadingProfile,]
  );

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
};
import React, {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";
import {
    collection,
    getDocs,
    query,
    orderBy,
    startAfter,
    limit,
    where,
    doc,
    getDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { MARKETPLACE_CATEGORIES } from "../marketplaceCategories";

const MarketplaceContext = createContext();

const PAGE_SIZE = 20;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

const ALL_CACHE_KEY = "marketplace_all_products_v2";
const categoryCacheKey = (id) =>
    `marketplace_category_${id}_v2`;

/* ---------------- HELPERS ---------------- */
const mergeUniqueById = (prev, next) => {
    const map = new Map();
    [...prev, ...next].forEach((p) => map.set(p.id, p));
    return Array.from(map.values());
};

const isCacheStale = (savedAt) =>
    !savedAt || Date.now() - savedAt > CACHE_TTL;

/* ---------------- PROVIDER ---------------- */
export function MarketplaceProvider({ children }) {
    const [products, setProducts] = useState([]);
    const [activeCategory, setActiveCategory] = useState("all");
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [hasMoreSearch, setHasMoreSearch] = useState(false);
    const lastDocRef = useRef(null);
    const fetchingRef = useRef(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const lastSearchDocRef = useRef(null);

    useEffect(() => {
        // Only trigger when user clears text manually
        if (searchQuery.trim() === "" && isSearching) {
            (async () => {
                setIsSearching(false);
                lastSearchDocRef.current = null;

                // Reset pagination for category
                lastDocRef.current = null;
                setHasMore(true);

                // Fetch current category products
                if (activeCategory === "all") {
                    await fetchProducts({ reset: true, force: true });
                } else {
                    const category = MARKETPLACE_CATEGORIES.find(
                        (c) => c.id === activeCategory
                    );
                    if (category) {
                        await fetchProducts({
                            categoryId: category.id,
                            reset: true,
                            force: true,
                        });
                    }
                }
            })();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery]);

    /* ---------------- CACHE ---------------- */
    const loadCache = (key) => {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    };

    const saveCache = (key, data) => {
        localStorage.setItem(key, JSON.stringify(data));
    };

    const restoreLastDoc = async (lastDocId) => {
        if (!lastDocId) return null;
        const snap = await getDoc(
            doc(db, "marketplaceProducts", lastDocId)
        );
        return snap.exists() ? snap : null;
    };

    /* ---------------- CORE FETCH ---------------- */
    // 🔧 CHANGES ARE COMMENTED WITH 🔥

    const fetchProducts = async ({ categoryId = null, reset = false, force = false }) => {
        if (!force && isSearching) return; // 🔥 block during search
        if (!force && (fetchingRef.current || (!hasMore && !reset))) return;

        fetchingRef.current = true;
        setLoading(true);

        try {
            let constraints = [
                orderBy("updatedAt", "desc"),
                limit(PAGE_SIZE),
            ];

            if (categoryId) {
                constraints.unshift(where("categoryId", "==", categoryId));
            }

            if (!reset && lastDocRef.current) {
                constraints.push(startAfter(lastDocRef.current));
            }

            const q = query(
                collection(db, "marketplaceProducts"),
                ...constraints
            );

            const snap = await getDocs(q);
            const newItems = snap.docs.map((d) => ({
                id: d.id,
                ...d.data(),
            }));

            const moreAvailable = snap.docs.length === PAGE_SIZE;
            const lastDoc = snap.docs.at(-1) || null;

            const cacheKey = categoryId
                ? categoryCacheKey(categoryId)
                : ALL_CACHE_KEY;

            setProducts((prev) => {
                const merged = reset
                    ? newItems
                    : mergeUniqueById(prev, newItems);

                if (merged.length > 0) {
                    saveCache(cacheKey, {
                        products: merged,
                        lastDocId: lastDoc?.id || null,
                        hasMore: moreAvailable,
                        savedAt: Date.now(),
                    });
                }

                return merged;
            });

            lastDocRef.current = lastDoc;
            setHasMore(moreAvailable);
        } finally {
            fetchingRef.current = false;
            setLoading(false);
        }
    };

    // Search Products Fetch
    const searchProducts = async ({ queryText, reset = false }) => {
        if (!queryText?.trim()) return;
        if (fetchingRef.current || (!hasMore && !reset)) return;

        fetchingRef.current = true;
        setLoading(true);

        if (reset) {
            setIsSearching(true);
            lastSearchDocRef.current = null;
            setProducts([]);
            setHasMoreSearch(true);
        }

        try {
            const constraints = [
                where("nameLower", ">=", queryText.toLowerCase()),
                where("nameLower", "<=", queryText.toLowerCase() + "\uf8ff"),
                orderBy("nameLower"),
                limit(PAGE_SIZE),
            ];

            if (!reset && lastSearchDocRef.current) {
                constraints.push(startAfter(lastSearchDocRef.current));
            }

            const q = query(
                collection(db, "marketplaceProducts"),
                ...constraints
            );

            const snap = await getDocs(q);
            const newItems = snap.docs.map((d) => ({
                id: d.id,
                ...d.data(),
            }));

            lastSearchDocRef.current = snap.docs.at(-1) || null;
            setHasMoreSearch(snap.docs.length === PAGE_SIZE);

            setProducts((prev) =>
                reset ? newItems : mergeUniqueById(prev, newItems)
            );
        } finally {
            fetchingRef.current = false;
            setLoading(false);
        }
    };

    // Search Helper
    const clearSearch = async () => {
        setSearchQuery("");
        setIsSearching(false);
        lastSearchDocRef.current = null;

        lastDocRef.current = null;
        setHasMoreSearch(true);
        setProducts([]);

        if (activeCategory === "all") {
            await fetchProducts({ reset: true });
        } else {
            const category = MARKETPLACE_CATEGORIES.find(
                (c) => c.id === activeCategory
            );
            if (category) {
                await fetchProducts({
                    categoryId: category.id,
                    reset: true,
                });
            }
        }
    };

    /* ---------------- INIT ---------------- */
    useEffect(() => {
        const cached = loadCache(ALL_CACHE_KEY);

        if (
            cached?.products?.length &&
            !isCacheStale(cached.savedAt)
        ) {
            setProducts(cached.products);
            setHasMore(cached.hasMore);
            restoreLastDoc(cached.lastDocId).then(
                (docSnap) => (lastDocRef.current = docSnap)
            );
        } else {
            setHasMore(true);
            fetchProducts({ reset: true });
        }
        // eslint-disable-next-line
    }, []);

    /* ---------------- CATEGORY SWITCH ---------------- */
    const setCategory = async (categoryId) => {
        if (categoryId === activeCategory) return;

        setIsSearching(false); // 🔥 exit search mode
        setSearchQuery("");
        lastSearchDocRef.current = null;
        setActiveCategory(categoryId);
        setProducts([]);
        setHasMore(true);
        lastDocRef.current = null;

        if (categoryId === "all") {
            const cached = loadCache(ALL_CACHE_KEY);
            if (cached?.products && !isCacheStale(cached.savedAt)) {
                setProducts(cached.products);
                setHasMore(cached.hasMore);
                lastDocRef.current = await restoreLastDoc(
                    cached.lastDocId
                );
                return;
            }
            fetchProducts({ reset: true });
            return;
        }

        const category = MARKETPLACE_CATEGORIES.find(
            (c) => c.id === categoryId
        );
        if (!category) return;

        const cacheKey = categoryCacheKey(category.id);
        const cached = loadCache(cacheKey);

        if (cached?.products && !isCacheStale(cached.savedAt)) {
            setProducts(cached.products);
            setHasMore(cached.hasMore);
            lastDocRef.current = await restoreLastDoc(
                cached.lastDocId
            );
            return;
        }

        fetchProducts({
            categoryId: category.id,
            reset: true,
        });
    };

    /* ---------------- LOAD MORE ---------------- */
    const fetchNextPage = () => {
        if (isSearching) {
            if (!hasMoreSearch) return;

            searchProducts({
                queryText: searchQuery,
                reset: false,
            });
            return;
        }

        if (activeCategory === "all") {
            fetchProducts({ reset: false });
        } else {
            const category = MARKETPLACE_CATEGORIES.find(
                (c) => c.id === activeCategory
            );
            if (category) {
                fetchProducts({
                    categoryId: category.id,
                    reset: false,
                });
            }
        }
    };

    return (
        <MarketplaceContext.Provider
            value={{
                products,
                loading,
                hasMore,
                activeCategory,
                setCategory,
                fetchNextPage,
                MARKETPLACE_CATEGORIES,

                // 🔍 search
                isSearching,
                searchQuery,
                setSearchQuery,
                searchProducts,
                hasMoreSearch,
                clearSearch
            }}
        >
            {children}
        </MarketplaceContext.Provider>
    );
}

export const useMarketplace = () =>
    useContext(MarketplaceContext);
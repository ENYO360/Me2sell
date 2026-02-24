import React, { useEffect, useMemo, useState, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { ThemeContext } from "../../context/ThemeContext";
import { useSellerCache } from "../../context/SellerCacheContext";
import { collection, getDocs, query, where, orderBy, limit, startAfter, getDoc, doc } from "firebase/firestore";
import { db, auth } from "../../firebase/config";
import { FaSearch, FaWhatsapp, FaPhoneAlt, FaBars, FaMoon, FaSun } from "react-icons/fa";
import LOgo from "../../images/me2sell-logo.png";
import { motion } from "framer-motion";
import ProductImageCarousel from "../dashboard/ProductImageCarousel";

export default function SellerProfile() {
    const { sellerId } = useParams();
    const cache = useSellerCache();

    const PAGE_SIZE = 20;

    const [lastDoc, setLastDoc] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [loadingProducts, setLoadingProducts] = useState(false);


    const [products, setProducts] = useState([]);
    const [seller, setSeller] = useState(null);
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState("");
    const [user, setUser] = useState(null);

    const { theme, toggleTheme } = useContext(ThemeContext);

    const LS_KEY = `seller_products_${sellerId}`;


    // 🔄 Auth
    useEffect(() => {
        const unsub = auth.onAuthStateChanged(setUser);
        return unsub;
    }, []);

    // ✅ Single useEffect for data loading
    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            // 1. Check memory cache first
            if (cache[sellerId]?.products) {
                setProducts(cache[sellerId].products);
                setLastDoc(cache[sellerId].lastDoc);
                setHasMore(cache[sellerId].hasMore);
                extractSellerFromProducts(cache[sellerId].products);
                setLoading(false);
                return;
            }

            // 2. Check localStorage cache
            const cached = localStorage.getItem(LS_KEY);
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    const AGE_LIMIT = 1000 * 60 * 30; // 30 minutes

                    // Use cache if fresh
                    if (Date.now() - parsed.timestamp < AGE_LIMIT) {
                        setProducts(parsed.products);
                        setHasMore(parsed.hasMore);
                        extractSellerFromProducts(parsed.products);
                        setLoading(false);
                        return;
                    }
                } catch (e) {
                    console.error("Cache parse error:", e);
                }
            }

            // 3. Fetch from Firestore only if no valid cache
            await fetchSellerProducts(false);
        };

        loadData();

        return () => {
            isMounted = false;
        };
    }, [sellerId]);

    const mergeUniqueById = (prev, next) => {
        const map = new Map();
        [...prev, ...next].forEach(item => {
            map.set(item.id, item);
        });
        return Array.from(map.values());
    };

    // ✅ Optimized fetch function
    const fetchSellerProducts = async (loadMore = false) => {
        if (loadingProducts || (!hasMore && loadMore)) return;

        setLoadingProducts(true);

        try {
            let q = query(
                collection(db, "marketplaceProducts"),
                where("sellerId", "==", sellerId),
                orderBy("createdAt", "desc"),
                limit(PAGE_SIZE)
            );

            if (loadMore && lastDoc) {
                q = query(q, startAfter(lastDoc));
            }

            const snap = await getDocs(q);

            const list = snap.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));

            // ✅ Single state update
            const mergedProducts = loadMore
                ? mergeUniqueById(products, list)
                : list;

            setProducts(mergedProducts);
            setLastDoc(snap.docs[snap.docs.length - 1] || null);
            setHasMore(snap.docs.length === PAGE_SIZE);

            // Update both caches
            const cacheData = {
                products: mergedProducts,
                lastDoc: snap.docs[snap.docs.length - 1] || null,
                hasMore: snap.docs.length === PAGE_SIZE,
                timestamp: Date.now(),
            };

            cache[sellerId] = cacheData;
            localStorage.setItem(LS_KEY, JSON.stringify(cacheData));

            if (!loadMore) {
                extractSellerFromProducts(mergedProducts);
            }

            setLoading(false);
        } catch (err) {
            console.error("Pagination error:", err);
        } finally {
            setLoadingProducts(false);
        }
    };

    const extractSellerFromProducts = (list) => {
        if (!list || list.length === 0) return;
        setSeller(list[0]);
    };

    // 🔍 Search seller products
    const filteredProducts = useMemo(() => {
        if (!searchQuery.trim()) return products;

        const q = searchQuery.toLowerCase();
        return products.filter(p =>
            p.name?.toLowerCase().includes(q) ||
            p.category?.toLowerCase().includes(q)
        );
    }, [products, searchQuery]);

    if (loading) {
        return <p className="text-center mt-20">Loading seller...</p>;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

            {/* ===== HEADER (REUSED LOGIC) ===== */}
            <div className="sticky top-0 z-20 bg-white dark:bg-gray-800 shadow-sm border-b px-4 py-3">
                <div className="max-w-7xl mx-auto flex items-center gap-3">
                    <Link to="/">
                        <img src={LOgo} alt="Me2Sell Logo" className="h-4 w-14" />
                    </Link>

                    <div className="flex-1 flex items-center bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2">
                        <FaSearch className="text-gray-400 mr-2" />
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search seller products..."
                            className="bg-transparent dark:text-gray-300 w-full outline-none text-sm"
                        />
                    </div>

                    {user && (
                        <Link to="/dashboard" className="hidden md:block text-blue-600">
                            My Stock
                        </Link>
                    )}

                    {/* Theme toggle */}
                    <button
                        onClick={toggleTheme}
                        className="p-1 rounded-full bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:scale-110 transition"
                    >
                        {theme === "light" ? <FaMoon /> : <FaSun />}
                    </button>
                </div>
            </div>

            {/* ===== SELLER INFO ===== */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-6">
                    <h2 className="text-2xl dark:text-gray-300 font-bold">{seller?.businessName}</h2>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Business Type: <span className="font-semibold">{seller?.businessType}</span>
                    </p>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Business Address: <span className="font-semibold">{seller?.address} • {seller?.country}</span>
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Contact: <span className="font-semibold">{seller?.phone}</span>
                    </p>

                    <div className="flex gap-3 mt-4">
                        <a
                            href={`tel:${seller?.phone}`}
                            className="flex items-center gap-2 px-4 py-2 border dark:border-gray-400 dark:text-gray-400 rounded-lg"
                        >
                            <FaPhoneAlt /> Call
                        </a>

                        <a
                            href={seller?.whatsappLink}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg"
                        >
                            <FaWhatsapp /> WhatsApp
                        </a>
                    </div>
                </div>

                {/* ===== SELLER PRODUCTS ===== */}
                <h3 className="text-xl dark:text-gray-300 font-semibold mb-3">
                    Products ({filteredProducts.length})
                </h3>

                {filteredProducts.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400">No products found.</p>
                ) : (
                    <div
                        layout={false}
                        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
                    >
                        {filteredProducts.map(product => (
                            <motion.div
                                key={product.id}
                                layout={false}
                                whileHover={{ y: -4 }}
                                className="bg-white dark:bg-gray-700 rounded-xl shadow hover:shadow-md overflow-hidden"
                            >
                                    <ProductImageCarousel
                                        images={[
                                            product.image,
                                            product.image2
                                        ].filter(Boolean)}
                                        imgHeight="40"
                                    />

                                <div className="p-2">
                                    <h4 className="text-sm dark:text-gray-300 font-semibold line-clamp-1">
                                        {product.name}
                                    </h4>

                                    <p className="text-green-600 font-bold mt-1">
                                        {product.currencySymbol}{product.sellingPrice?.toLocaleString()}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {hasMore && (
                    <div className="flex justify-center mt-6">
                        <button
                            onClick={() => fetchSellerProducts(true)}
                            disabled={loadingProducts}
                            className="px-6 py-2 rounded-lg bg-black text-white disabled:opacity-50"
                        >
                            {loadingProducts ? "Loading..." : "Load more"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
import React, { useState, useMemo, useEffect, useContext, useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ThemeContext } from "../../context/ThemeContext";
import { useMarketplace } from "../../context/MarketPlaceContext";
import LOgo from "../../images/me2sell-logo.png";
import EnyotronicsLogo from "../../images/enyotronics-logo.png";
import { FaSearch, FaWhatsapp, FaPhoneAlt, FaBars, FaMoon, FaSun } from "react-icons/fa";
import { MdKeyboardArrowDown } from "react-icons/md";
import { auth, db } from "../../firebase/config";
import ProductImageCarousel from "../dashboard/ProductImageCarousel";

export default function BuyerMarketplace({ categories = [] }) {
    const [user, setUser] = useState(null);

    const [showCategories, setShowCategories] = useState(false);
    const [showMobileCategoryDropdown, setShowMobileCategoryDropdown] = useState(false);
    const [viewMode, setViewMode] = useState("category");

    const [selectedProduct, setSelectedProduct] = useState(null);
    const [imageIndexes, setImageIndexes] = useState({});

    const imageTimersRef = useRef({});
    const modalScrollRef = useRef(null);

    const { theme, toggleTheme } = useContext(ThemeContext);
    const {
        products,
        loading,
        fetchNextPage,
        hasMore,
        hasMoreSearch,
        activeCategory,
        setCategory,
        searchProducts,
        searchQuery,
        setSearchQuery,
        clearSearch,
        isSearching,
        topSelling,
        fetchAllProducts,
        MARKETPLACE_CATEGORIES
    } = useMarketplace();

    //const isSearching = searchQuery.trim().length > 0;

    const hasMoreRef = useRef(true);

    // 🔄 Listen to auth state changes
    useEffect(() => {
        const unsub = auth.onAuthStateChanged((u) => {
            setUser(u);
        });

        return () => unsub();
    }, []);

    // scroll to the top of modal when selected product changes
    useEffect(() => {
        if (modalScrollRef.current) {
            modalScrollRef.current.scrollTo({
                top: 0,
                behavior: "smooth",
            });
        }
    }, [selectedProduct]);

    // Active Category Label
    const activeCategoryLabel = () => {
        const category = MARKETPLACE_CATEGORIES.find(c => c.id === activeCategory);
        return category?.name || "Products";
    }

    // Other products from the same seller
    const sellerProducts = useMemo(() => {
        if (!selectedProduct) return [];

        return products.filter(
            (p) =>
                p.sellerId === selectedProduct.sellerId &&
                p.id !== selectedProduct.id
        );
    }, [products, selectedProduct]);

    // Products to be displayed
    const displayedProducts = useMemo(() => {
        return Array.isArray(products) ? products : [];
    }, [products, searchQuery, activeCategory, viewMode, isSearching]);

    // Product grid title
    const sectionTitle = useMemo(() => {
        if (isSearching) return `Search results for "${searchQuery}"`;
        //if (viewMode === "top-selling") return "Top Selling Products";
        const category = MARKETPLACE_CATEGORIES.find(c => c.id === activeCategory);
        return category?.name || "Products";
    }, [activeCategory, viewMode, isSearching, searchQuery]);

    const similarProducts = useMemo(() => {
        if (!selectedProduct || !products?.length) return [];

        const keywords = selectedProduct.name
            .toLowerCase()
            .split(" ")
            .filter(word => word.length > 2); // ignore small words

        return products.filter((product) => {
            if (product.id === selectedProduct.id) return false;

            const name = product.name.toLowerCase();
            return keywords.some(keyword => name.includes(keyword));
        });
    }, [selectedProduct, products]);

    // Product Image Slide
    useEffect(() => {
        displayedProducts.forEach((product) => {
            const images = [product.image, product.image2].filter(Boolean);

            // Skip if only one image
            if (images.length <= 1) return;

            // Prevent duplicate timers
            if (imageTimersRef.current[product.id]) return;

            // Random interval between 2s and 6s
            const randomDelay = Math.floor(Math.random() * 10000) + 8000;

            const intervalId = setInterval(() => {
                setImageIndexes((prev) => ({
                    ...prev,
                    [product.id]: ((prev[product.id] || 0) + 1) % images.length,
                }));
            }, randomDelay);

            imageTimersRef.current[product.id] = intervalId;
        });

        // Cleanup removed products
        return () => {
            Object.entries(imageTimersRef.current).forEach(([id, timer]) => {
                if (!displayedProducts.find((p) => p.id === id)) {
                    clearInterval(timer);
                    delete imageTimersRef.current[id];
                }
            });
        };
    }, [displayedProducts]);

    const handleCategorySelect = (categoryId) => {
        setCategory(categoryId);
        setViewMode("category");
        setSearchQuery("");
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();

        if (!searchQuery.trim()) {
            clearSearch();
            return;
        }

        searchProducts({
            queryText: searchQuery,
            reset: true
        });
    };

    /* const handleViewTopSelling = () => {
         setViewMode("top-selling");
         setSearchQuery("");
     };
     */

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* SEARCH BAR */}
            <div className="sticky top-0 z-20 bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-800 px-2 py-3">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
                    <div>
                        <Link to="/">
                            <img src={LOgo} alt="Me2Sell Logo" className="h-8 w-auto hidden md:block" />
                        </Link>
                    </div>
                    <button
                        onClick={() => setShowCategories(true)}
                        className="md:hidden p-2 rounded-lg bg-gray-100"
                    >
                        <FaBars />
                    </button>

                    <div className="w-full max-w-2xl">
                        <form
                            onSubmit={handleSearchSubmit}
                            className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-full pl-4 pr-1 py-1
                                        focus-within:ring-2 focus-within:ring-black dark:focus-within:ring-gray-300 transition"
                        >
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                                className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400"
                            />

                            <button
                                type="submit"
                                disabled={!searchQuery.trim()}
                                className="flex items-center justify-center w-9 h-9 rounded-full bg-black text-white transition hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                aria-label="Search"
                            >
                                <FaSearch className="text-sm" />
                            </button>
                        </form>
                    </div>

                    <div>
                        <Link to="/">
                            <img src={LOgo} alt="Me2Sell Logo" className="w-16 md:hidden" />
                        </Link>
                    </div>

                    {/* MODE TOGGLE (DESKTOP) */}

                    {
                        user &&
                        (
                            <div className="hidden md:block">
                                <Link to="/dashboard" className="text-blue-600 hover:text-blue-800">My Stock</Link>
                            </div>
                        )
                    }

                    {/* Theme toggle */}
                    <button
                        onClick={toggleTheme}
                        className="hidden md:block p-1 rounded-full bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:scale-110 transition"
                    >
                        {theme === "light" ? <FaMoon /> : <FaSun />}
                    </button>
                </div>
            </div>

            <div className=" mx-auto px-6 py-2 gap-6">
                {/* DESKTOP SECOND NAVBAR */}
                <div className="hidden md:block bg-white dark:bg-gray-900 border-b dark:border-gray-800 mb-4">
                    <div className="max-w-7xl mx-auto px-4">
                        <ul className="flex items-center justify-center gap-8 text-sm font-medium text-gray-700 dark:text-gray-300 h-12">

                            {/* CATEGORIES DROPDOWN */}
                            <li className="relative group cursor-pointer">
                                <span className="hover:text-green-600">
                                    Categories <MdKeyboardArrowDown className="inline-block" />
                                </span>

                                {/* DROPDOWN */}
                                <div className="absolute left-0 top-full mt-2 w-56 h-96 bg-white shadow-lg rounded-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible dark:bg-gray-800 dark:border-gray-700 transition-all z-30 overflow-scroll">
                                    <ul className="py-2">
                                        {MARKETPLACE_CATEGORIES.map((cat) => (
                                            <li
                                                key={cat.id}
                                                onClick={() => { handleCategorySelect(cat.id); }}
                                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                            >
                                                {cat.name}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>


                {/* PRODUCT GRID */}
                <section className="flex-1">
                    {/* CATEGORY TITLE */}
                    <div className="mb-4 flex items-center">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-300">
                            {sectionTitle}
                        </h2>
                    </div>

                    {/* LOADING STATE (INLINE, NOT REPLACING GRID) */}
                    {loading && products.length === 0 && (
                        <p className="text-center mt-20 text-gray-500">
                            Loading marketplace...
                        </p>
                    )}

                    {/* EMPTY STATE */}
                    {!loading && displayedProducts.length === 0 && (
                        <p className="text-center mt-20 text-gray-500">
                            {isSearching ? "No search results found" : "No products found"}
                        </p>
                    )}

                    <motion.div
                        layout={false}
                        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2"
                    >
                        {displayedProducts.map((product) => (
                            <motion.div
                                key={`grid-${product.id}`}
                                layout
                                whileHover={{ y: -4 }}
                                onClick={() => setSelectedProduct(product)}
                                className="bg-white dark:bg-gray-700 rounded-xl shadow-sm hover:shadow-md transition overflow-hidden"
                            >
                                {(() => {
                                    const images = [product.image, product.image2].filter(Boolean);
                                    const index = imageIndexes[product.id] || 0;

                                    return (
                                        <motion.img
                                            key={index}
                                            src={images[index]}
                                            alt={product.name}
                                            className="w-full h-40 md:h-44 object-cover"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.9 }}
                                        />
                                    );
                                })()}


                                {/* DETAILS */}
                                <div className="p-2">
                                    <h4 className="font-semibold text-xs md:text-sm text-gray-800 dark:text-gray-100 line-clamp-1">
                                        {product.name}
                                    </h4>
                                    <div className="flex gap-1 flex-wrap items-center justify-between">
                                        <p className="text-green-600 font-bold md:text-lg text-sm mt-1">
                                            {product.currencySymbol}{product.sellingPrice.toLocaleString()}
                                        </p>
                                        <p className="mt-1 md:text-sm text-xs text-gray-600 dark:text-gray-400">{product.sold || 0} Sold</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>

                    {!loading && (
                        isSearching ? hasMoreSearch : hasMore
                    ) && (
                        <div className="flex justify-center mt-6">
                            <button
                                onClick={fetchNextPage}
                                disabled={loading}
                                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                                {loading ? "Loading..." : "Load More"}
                            </button>
                        </div>
                    )}

                    {!hasMoreRef.current && (
                        <p className="text-center text-xs text-gray-500 mt-4">
                            No more products to load
                        </p>
                    )}

                    <div className="flex items-center justify-center gap-2 mt-auto py-2">
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                            Powered by:
                        </p>
                        <Link to="/enyotronics">
                            <img
                                src={EnyotronicsLogo}
                                alt="Enyotronics logo"
                                className="w-24"
                            />
                        </Link>
                    </div>
                </section>
            </div>

            {/* MOBILE CATEGORY DRAWER */}
            {showCategories && (
                <div
                    className="fixed inset-0 z-30 bg-black/40 md:hidden"
                    onClick={() => setShowCategories(false)}
                >
                    <motion.div
                        initial={{ x: -300 }}
                        animate={{ x: 0 }}
                        exit={{ x: -300 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-60 h-full bg-white dark:bg-gray-900 p-4 flex flex-col"
                    >
                        {/* HEADER */}
                        <div className="mb-4 border-b pb-3 flex items-center justify-between gap-2">
                            <div>
                                <h3 className="font-semibold dark:text-gray-300 text-lg">Marketplace</h3>
                                <p className="text-sm text-gray-500">
                                    {activeCategoryLabel}
                                </p>
                            </div>
                            {/* Theme toggle */}
                            <button
                                onClick={toggleTheme}
                                className="p-1 rounded-full bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:scale-110 transition"
                            >
                                {theme === "light" ? <FaMoon /> : <FaSun />}
                            </button>
                        </div>

                        {/* NAV LIST */}
                        <ul className="space-y-1 text-sm">

                            {/* CATEGORIES DROPDOWN */}
                            <li>
                                <button
                                    onClick={() =>
                                        setShowMobileCategoryDropdown((prev) => !prev)
                                    }
                                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
                                    <span className="font-medium dark:text-gray-300">Categories</span>
                                    <MdKeyboardArrowDown
                                        className={`transition-transform dark:text-gray-300 ${showMobileCategoryDropdown ? "rotate-180" : ""}`}
                                    />
                                </button>

                                {/* DROPDOWN */}
                                {showMobileCategoryDropdown && (
                                    <ul className="mt-1 ml-3 border-l pl-3 space-y-1 overflow-scroll h-48">
                                        {/* MARKETPLACE CATEGORIES */}
                                        {MARKETPLACE_CATEGORIES.map((cat) => (
                                            <li
                                                key={cat.id}
                                                onClick={() => {
                                                    setCategory(cat.id);
                                                    setShowCategories(false);
                                                    setShowMobileCategoryDropdown(false);
                                                    setViewMode("category");
                                                }}
                                                className={`p-2 rounded-lg dark:text-gray-400 cursor-pointer ${activeCategory === cat.id
                                                    ? "bg-green-100 dark:bg-green-800 text-green-700 font-medium"
                                                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                                                    }`}
                                            >
                                                {cat.name}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </li>
                            {user && (
                                <li>
                                    <Link to="/dashboard" className="w-full block p-3 rounded-lg dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium">
                                        My Seller Account
                                    </Link>
                                </li>
                            )}
                        </ul>
                        <div className="flex items-center justify-center gap-2 mt-auto">
                            <p className="text-xs text-gray-600 dark:text-gray-300">
                                Powered by:
                            </p>
                            <Link to="/enyotronics">
                                <img
                                    src={EnyotronicsLogo}
                                    alt="Enyotronics logo"
                                    className="w-24"
                                />
                            </Link>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* PRODUCT DETAILS MODAL */}
            {selectedProduct && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
                    onClick={() => setSelectedProduct(null)}
                >
                    <motion.div
                        ref={modalScrollRef}
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white dark:bg-gray-800 w-full max-w-4xl rounded-xl overflow-hidden shadow-xl max-h-[90vh] overflow-y-auto"
                    >
                        {/* HEADER */}
                        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-300 line-clamp-1">
                                {selectedProduct.name}
                            </h3>
                            <button
                                onClick={() => setSelectedProduct(null)}
                                className="text-gray-500 hover:text-gray-700 text-xl"
                            >
                                ✕
                            </button>
                        </div>

                        {/* CONTENT */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">

                            {/* IMAGES */}
                            <div>
                                <ProductImageCarousel
                                    images={[
                                        selectedProduct.image,
                                        selectedProduct.image2
                                    ].filter(Boolean)}
                                    imgHeight="60"
                                />

                                {/* SIMILAR PRODUCTS DISPLAY FOR DESKTOP */}
                                {similarProducts.length > 0 && (
                                    <div className="border-t dark:border-gray-600 pt-4 mt-4 w-full hidden md:block">
                                        <h4 className="font-semibold mb-3 text-gray-800 dark:text-gray-300 dark:t">
                                            Similar Products
                                        </h4>

                                        <div className="flex gap-3 overflow-x-auto pb-2">
                                            {similarProducts.slice(0, 6).map((item) => (
                                                <div
                                                    key={`similar-${item.id}`}
                                                    onClick={() => setSelectedProduct(item)}
                                                    className="min-w-[140px] cursor-pointer bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden border dark:border-gray-500 hover:shadow-sm transition"
                                                >
                                                    <img
                                                        src={item.image}
                                                        alt={item.name}
                                                        className="w-full h-28 object-cover"
                                                    />

                                                    <div className="p-2">
                                                        <p className="text-xs dark:text-gray-400 font-medium line-clamp-1">
                                                            {item.name}
                                                        </p>

                                                        <p className="text-sm font-semibold text-green-600 mt-1">
                                                            {item.currencySymbol}{item.sellingPrice?.toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* DETAILS */}
                            <div className="space-y-3">
                                <p className="text-2xl font-bold text-green-600">
                                    {selectedProduct.currencySymbol}{selectedProduct.sellingPrice?.toLocaleString()}
                                </p>

                                <p className="text-gray-700 dark:text-gray-400">
                                    {selectedProduct.description || "No description provided"}
                                </p>

                                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                    <p><strong>Category:</strong> {selectedProduct.category}</p>
                                    <p><strong>Available Quantity:</strong> {selectedProduct.quantity}</p>
                                </div>

                                {/* SELLER INFO */}
                                <div className="border-t dark:border-gray-700 pt-1 mt-1">
                                    <h4 className="font-semibold mb-2 dark:text-gray-300">Seller Information</h4>

                                    <p className="text-sm text-gray-700 dark:text-gray-400">
                                        <span className="text-gray-900 dark:text-gray-400 font-semibold mr-1">
                                            Name:
                                        </span>
                                        {selectedProduct.businessName || "Not Specified"}
                                    </p>
                                    <p className="text-sm text-gray-700 dark:text-gray-400">
                                        <span className="text-gray-900 dark:text-gray-400 font-semibold mr-1">
                                            Business Type:
                                        </span>
                                        {selectedProduct.businessType || "Not Specified"}
                                    </p>
                                    <p className="text-sm text-gray-700 dark:text-gray-400">
                                        <span className="text-gray-900 dark:text-gray-400 font-semibold mr-1">
                                            Address:
                                        </span>
                                        {selectedProduct.address || "Not Specified"}
                                    </p>
                                    <p className="text-sm text-gray-700 dark:text-gray-400">
                                        <span className="text-gray-900 dark:text-gray-400 font-semibold mr-1">
                                            Country:
                                        </span>
                                        {selectedProduct.country || "Not Specified"}
                                    </p>

                                    <div className="flex gap-3 mt-3">
                                        <a
                                            href={`tel:${selectedProduct.phone}`}
                                            className="flex-1 flex items-center justify-center gap-2 border border-gray-300 text-gray-700 dark:text-gray-400 py-2 rounded-lg hover:bg-gray-100"
                                        >
                                            <FaPhoneAlt /> Call
                                        </a>

                                        <a
                                            href={selectedProduct.whatsappLink}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                                        >
                                            <FaWhatsapp /> WhatsApp
                                        </a>
                                    </div>
                                </div>

                                {/* MORE FROM SELLER */}
                                {sellerProducts.length > 0 && (
                                    <div className="border-t dark:border-gray-700 pt-4 mt-1 w-full">
                                        <h4 className="font-semibold mb-3 text-gray-800 dark:text-gray-300">
                                            More products from this seller
                                        </h4>

                                        <div className="flex gap-3 overflow-x-auto pb-2">
                                            {sellerProducts.slice(0, 6).map((item) => (
                                                <div
                                                    key={`seller-${item.id}`}
                                                    onClick={() => setSelectedProduct(item)}
                                                    className="min-w-[140px] cursor-pointer bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden border dark:border-gray-500 hover:shadow-sm transition"
                                                >
                                                    <img
                                                        src={item.image}
                                                        alt={item.name}
                                                        className="w-full h-28 object-cover"
                                                    />

                                                    <div className="p-2">
                                                        <p className="text-xs dark:text-gray-400 font-medium line-clamp-1">
                                                            {item.name}
                                                        </p>
                                                        <p className="text-sm font-semibold text-green-600 mt-1">
                                                            {item.currencySymbol}{item.sellingPrice?.toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <Link
                                            to={`/seller/${selectedProduct.sellerId}`}
                                            className="inline-block mt-1 text-blue-600 font-medium hover:underline"
                                        >
                                            View Seller Profile →
                                        </Link>

                                    </div>
                                )}

                                {/* SIMILAR PRODUCTS DISPLAY FOR MOBILE */}
                                {similarProducts.length > 0 && (
                                    <div className="border-t dark:border-gray-600 pt-4 mt-4 w-full md:hidden">
                                        <h4 className="font-semibold mb-3 text-gray-800 dark:text-gray-300">
                                            Similar Products
                                        </h4>

                                        <div className="flex gap-3 overflow-x-auto pb-2">
                                            {similarProducts.slice(0, 6).map((item) => (
                                                <div
                                                    key={`similar-${item.id}`}
                                                    onClick={() => setSelectedProduct(item)}
                                                    className="min-w-[140px] cursor-pointer bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden border dark:border-gray-500 hover:shadow-sm transition"
                                                >
                                                    <img
                                                        src={item.image}
                                                        alt={item.name}
                                                        className="w-full h-28 object-cover"
                                                    />

                                                    <div className="p-2">
                                                        <p className="text-xs dark:text-gray-400 font-medium line-clamp-1">
                                                            {item.name}
                                                        </p>

                                                        <p className="text-sm font-semibold text-green-600 mt-1">
                                                            {item.currencySymbol}{item.sellingPrice?.toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}

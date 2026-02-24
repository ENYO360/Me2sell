import React, { useState, useContext, useEffect } from "react";
import { ThemeContext } from "../../context/ThemeContext";
import { AuthContext } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useNotification } from "../../context/NotificationContext";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { auth, db } from "../../firebase/config";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { HiBuildingOffice2 } from "react-icons/hi2";
import { BiSolidCategoryAlt } from "react-icons/bi";
import { IoNotifications } from "react-icons/io5";
import { MdSell } from "react-icons/md";
import Logo from "../../images/me2sell-logo.png";
import EnyotronicsLogo from "../../images/enyotronics-logo.png"
import SearchBar from "./SearchBar";
import {
    FaBars,
    FaHome,
    FaBox,
    FaShoppingCart,
    FaHistory,
    FaSignOutAlt,
    FaSun,
    FaMoon,
    FaUserTie,
    FaUsers,
} from "react-icons/fa";

export default function DashboardLayout({ children }) {
    const { theme, toggleTheme } = useContext(ThemeContext);
    const { cartItems } = useCart();
    const { unreadCount } = useNotification();
    const navigate = useNavigate();
    const location = useLocation();
    const [open, setOpen] = useState(false); // Mobile sidebar toggle
    const [businessName, setBusinessName] = useState("");

    const { logout } = useContext(AuthContext);

    const navItems = [
        { to: "/dashboard", icon: <FaHome />, label: "Home" },
        { to: "/dashboard/overview", icon: <FaHome />, label: "Overview" },
        { to: "/dashboard/products", icon: <FaBox />, label: "Products" },
        { to: "/dashboard/cart", icon: <FaShoppingCart />, label: "Cart" },
        { to: "/dashboard/sales-history", icon: <FaHistory />, label: "Sales History" },
        { to: "/dashboard/departments", icon: <HiBuildingOffice2 />, label: "Departments" },
        { to: "/dashboard/categories", icon: <BiSolidCategoryAlt />, label: "Categories" },
        { to: "/dashboard/profile", icon: <FaUserTie />, label: "Profile" },
        { to: "/dashboard/staff", icon: <FaUsers />, label: "Staff" },
        { to: "/marketplace", icon: <MdSell />, label: "Marketplace" }
    ];

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;

        const cached = localStorage.getItem("businessName");
        if (cached) {
            setBusinessName(cached);
            return; // stop here
        }

        const fetchProfile = async () => {
            const ref = doc(db, "businessProfiles", user.uid);
            const snap = await getDoc(ref);

            if (snap.exists()) {
                setBusinessName(
                    snap.data()?.business?.businessName ?? "My Business"
                );
            }
        };

        fetchProfile();
    }, []);

    useEffect(() => {
        if (businessName) {
            localStorage.setItem("businessName", businessName);
        }
    }, [businessName]);

    // 🔥 Update user location check interval to 7 days
    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;

        const updateLocation = async () => {
            try {
                // Check if location was updated recently (within last 7 days)
                const lastUpdate = localStorage.getItem(`location_updated_${user.uid}`);

                if (lastUpdate) {
                    const timeSinceUpdate = Date.now() - parseInt(lastUpdate);
                    const sevenDays = 7 * 24 * 60 * 60 * 1000; // 🔥 7 days in milliseconds

                    if (timeSinceUpdate < sevenDays) {
                        console.log("⏭️ Location checked within last 7 days, skipping...");
                        return;
                    }
                }

                console.log("🔄 Updating user location (7-day check)...");

                // Call Firebase Function
                const functions = getFunctions();
                const updateUserLocation = httpsCallable(functions, "updateUserLocation");

                const result = await updateUserLocation({});

                if (result.data.success) {
                    console.log("✅ Location updated:", result.data.location);

                    // Update lastActivity timestamp
                    const profileRef = doc(db, "businessProfiles", user.uid);
                    await updateDoc(profileRef, {
                        lastActivity: serverTimestamp()
                    });

                    // Cache the update time
                    localStorage.setItem(`location_updated_${user.uid}`, Date.now().toString());
                }
            } catch (error) {
                console.error("❌ Location update failed:", error);
            }
        };

        // Run on mount
        updateLocation();

        // 🔥 OPTIONAL: Remove interval entirely since scheduled function handles it
        // OR keep a daily check but only call if 7 days passed
        const dailyCheck = setInterval(() => {
            updateLocation(); // Will only run if 7 days passed
        }, 24 * 60 * 60 * 1000); // Check once per day

        return () => clearInterval(dailyCheck);
    }, []);

    const totalItemsInCart = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <div className="flex min-h-screen flex-col bg-gray-100 dark:bg-gray-900 transition-colors">

            {/* =========================== */}
            {/* Desktop Sidebar */}
            {/* =========================== */}
            <aside className="hidden md:flex fixed top-0 h-full w-64 bg-white dark:bg-gray-800 shadow-lg flex-col p-4">
                <Link to="/" className="text-xl font-bold mb-6 mt-2 text-gray-800 dark:text-white">
                    <img src={Logo} alt="Me2sell Logo" className="w-16 mx-auto " />
                </Link>

                <nav className="flex flex-col gap-3 relative">
                    {navItems.map(item => {
                        const isActive = location.pathname === item.to;
                        return (
                            <Link
                                key={item.to}
                                to={item.to}
                                className={`relative flex items-center gap-3 p-2 rounded-lg text-gray-800 dark:text-gray-200 transition`}
                            >
                                {item.icon}
                                <span className={`relative z-10 ${isActive ? "text-white" : ""}`}>{item.label}</span>
                                {isActive && (
                                    <motion.div
                                        layoutId="activeLink"
                                        className="absolute inset-0 bg-blue-500 rounded-lg z-0"
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="mt-auto flex items-center gap-4">
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 p-2 rounded-lg  hover:text-red-300 text-red-500 transition"
                    >
                        <FaSignOutAlt /> Logout
                    </button>
                    <Link to="/how-it-works" className="font-semibold text-green-500">
                        How it Works
                    </Link>
                </div>
            </aside>

            {/* =========================== */}
            {/* Mobile Sidebar */}
            <AnimatePresence>
                {open && (
                    <>
                        {/* OVERLAY */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 bg-black z-40 md:hidden"
                            onClick={() => setOpen(false)}
                        />
                        {/* SIDEBAR */}
                        <motion.aside
                            initial={{ x: -300, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -300, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 80 }}
                            className="fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 shadow-lg p-4 flex flex-col z-50 md:hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-5">
                                <Link to="/">
                                    <img src={Logo} alt="Me2sell Logo" className="w-16  " />
                                </Link>
                                {/* Close button */}
                                <button
                                    onClick={() => setOpen(false)}
                                    className="self-end p-2 mb-4 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-gray-100 transition"
                                >
                                    ✕
                                </button>
                            </div>

                            <nav className="flex flex-col gap-3 relative">
                                {navItems.map(item => {
                                    const isActive = location.pathname === item.to;
                                    return (
                                        <Link
                                            key={item.to}
                                            to={item.to}
                                            onClick={() => setOpen(false)}
                                            className={`relative flex items-center gap-3 p-2 rounded-lg text-gray-800 dark:text-gray-200 transition`}
                                        >
                                            {item.icon}
                                            <span className="relative z-10">{item.label}</span>
                                            {isActive && (
                                                <motion.div
                                                    layoutId="activeLink"
                                                    className="absolute inset-0 bg-blue-500 rounded-lg z-0"
                                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                />
                                            )}
                                        </Link>
                                    );
                                })}
                            </nav>

                            <div className="mt-auto flex items-center gap-4">
                                <button
                                    onClick={logout}
                                    className="flex items-center gap-3 p-2 rounded-lg hover:text-red-300 text-red-500 transition"
                                >
                                    <FaSignOutAlt /> Logout
                                </button>
                                <Link to="/how-it-works" className="font-semibold text-green-500">
                                    How it Works
                                </Link>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* =========================== */}
            {/* Main Content */}
            <div className="flex-1 p-6 md:ml-64 relative">
                <div className="flex justify-between md:items-center items-start mb-6 fixed top-0 left-0 right-0 md:left-64 bg-gray-100 dark:bg-gray-900 p-4 z-40 md:pt-5">
                    {/* Mobile menu toggle */}
                    <button
                        onClick={() => setOpen(!open)}
                        className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow hover:scale-105 transition md:hidden"
                    >
                        <FaBars className="text-gray-700 dark:text-gray-200" />
                    </button>

                    <div className="w-full flex flex-col md:flex-row items-center md:items-center md:justify-between justify-center gap-4">

                        {/* BUSINESS NAME */}
                        <div className="flex items-center gap-2 w-2/4">
                            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 
                         rounded-lg font-semibold text-lg tracking-wide shadow-sm mx-auto md:mx-0 truncate">
                                {businessName}
                            </span>
                        </div>

                        {/* SEARCH BAR */}
                        <div className="flex w-full justify-center">
                            <SearchBar />
                        </div>

                    </div>

                    <div className="md:flex grid mx-4 md:mx-0 items-center gap-4 justify-between">
                        <Link to="/dashboard/cart" className="relative">
                            <FaShoppingCart className="text-2xl text-gray-700 hover:text-blue-600" />

                            {totalItemsInCart > 0 && (
                                <span
                                    className="absolute -top-3 -right-2 bg-red-600 text-white text-xs
                                        w-5 h-5 flex items-center justify-center rounded-full shadow-md"
                                >
                                    {totalItemsInCart}
                                </span>
                            )}
                        </Link>
                        {/* <Link to="/dashboard/notifications" className="relative">
                            <IoNotifications className="text-xl dark:text-gray-600" />

                            {unreadCount > 0 && (
                                <span className="absolute -top-3 -right-2 bg-red-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                                    {unreadCount}
                                </span>
                            )}
                        </Link>
                       */}
                        {/* Theme toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-1 rounded-full bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:scale-110 transition"
                        >
                            {theme === "light" ? <FaMoon /> : <FaSun />}
                        </button>
                    </div>

                </div>
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-20"
                >
                    {children}
                </motion.div>
                <footer className="mt-auto py-2">
                    <div className="flex items-center justify-center gap-2">
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
                </footer>
            </div>
        </div>
    );
}

import React, { useState, useEffect } from "react";
import { auth } from "../firebase/config";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Logo from "../images/me2sell-logo.png";
import { FiLogIn, FiLogOut } from "react-icons/fi";
import { HiUserAdd } from "react-icons/hi";
import { MdSpaceDashboard } from "react-icons/md";
import { FaBook, FaPlay, FaChevronDown, FaPrint, FaSearch, FaTruck, FaUsers, FaBox, FaCashRegister, FaCog } from "react-icons/fa";

export default function SalesBookGuide() {
    const steps = [
        {
            id: "overview",
            title: "Overview; What Me2sell does",
            body: `Me2sell is a lightweight Point-of-Sale and inventory management web app for small businesses.\n\nIt helps you add and categorize products, record quick sales (direct sales or cart checkout), manage stock, generate reports, and invite staff with custom permissions, all under a single business account.`
        },
        {
            id: "getting-started",
            title: "Getting started. Create your account",
            body: `1. Sign up with your email and create your business profile.\n2. Add the business details (name, country, currency) after succesful registration.\n3. Add your first product or categories, you can always edit later.`
        },
        {
            id: "dashboard",
            title: "Dashboard-overview",
            body: `The Dashboard gives you an overview of: total sales, total profit, top selling products, recent sales, and low/out-of-stock alerts. Use the date-range filters to switch between Today / This Week / Month / Year / All Time.`
        },
        {
            id: "products",
            title: "Products. Add, edit & manage stock",
            body: `Add products with cost price, selling price, category and department.\n- Use the product grid to edit, delete, or open a three-dot menu for actions.\n- Low stock and Out of stock badges appear automatically.\n- When a sale is recorded the product quantity is decremented.`
        },
        {
            id: "sales",
            title: "Sales. Direct sale and Cart Checkout",
            body: `Record sales via the Sell button (direct sale) or add multiple products to the Cart and checkout.\n- Sales store items sold, quantities, total amount and timestamps.\n- Profit is calculated as (sellingPrice - costPrice) × quantity for each item and summed per sale.`
        },
        {
            id: "staff",
            title: "Staff. Invite & manage access",
            body: `The Admin can add staff under Business -> Staff. Each staff gets a 6-digit login code.\n- Admin chooses permissions for each staff (view-only or edit rights for products, sales, categories, etc.).\n- Staff login with the code (or use an assigned auth user).\n- Admin may regenerate codes, edit permissions or delete staff.`
        },
        {
            id: "reports",
            title: "Reports & History",
            body: `Sales History lists all sales with details. Use filters (dates, top products) to build quick reports. Exporting and advanced analytics can be added later.`
        },
        {
            id: "settings",
            title: "Settings & Business Profile",
            body: `Update business name, address, country (searchable dropdown), currency (searchable dropdown with symbol), and admin profile.`
        },
        {
            id: "tips",
            title: "Best Practices & Tips",
            body: `• Keep costPrice accurate so profit figures are correct.\n• Use departments + categories for better organization.\n• Regenerate staff codes if compromised.`
        }
    ];

    const [user, setUser] = useState(null);

    useEffect(() => {
        const unsub = auth.onAuthStateChanged((u) => setUser(u));
        return () => unsub();
    }, []);

    const logout = async () => {
        await auth.signOut();
    };

    return (
        <>
            {/* HEADER */}
            <header className="w-full py-4 px-6 bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
                <div className="max-w-7xl gap-4 mx-auto flex justify-between items-center">

                    {/* Logo */}
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                        <Link to="/" className="flex items-center gap-2">
                            <img src={Logo} alt="Me2sell Logo" className="w-12" />
                        </Link>
                    </motion.div>

                    {/* Navigation */}
                    <nav className="flex items-center gap-6 text-[15px] font-medium">
                        {user ? (
                            <>
                                <Link
                                    to="/dashboard"
                                    className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition"
                                >
                                    <MdSpaceDashboard size={20} /> Dashboard
                                </Link>

                                <button
                                    onClick={logout}
                                    className="flex items-center gap-2 text-red-600 hover:text-red-700 transition"
                                >
                                    <FiLogOut size={20} /> Logout
                                </button>
                            </>
                        ) : (
                            <div className="flex flex-wrap justify-between gap-4">
                                <Link
                                    to="/login"
                                    className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition"
                                >
                                    <FiLogIn size={18} /> Login
                                </Link>

                                <Link
                                    to="/signup"
                                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm"
                                >
                                    <HiUserAdd size={20} /> Create Account
                                </Link>
                            </div>
                        )}
                    </nav>
                </div>
            </header>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <motion.header
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8"
                    >
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-600 text-white p-3 rounded-xl shadow-lg">
                                <FaBook className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-extrabold">Me2sell Quick Start Guide</h1>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                    Step-by-step walkthrough for new users. Learn the core flows fast.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => window.print()}
                                className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-2 rounded-lg shadow hover:scale-105 transition"
                            >
                                <FaPrint /> Print Guide
                            </button>
                        </div>
                    </motion.header>

                    {/* Detailed accordion */}
                    <div className="space-y-4">
                        {steps.map((s) => (
                            <Accordion key={s.id} id={s.id} title={s.title} defaultOpen={s.id === 'getting-started'}>
                                <div className="prose dark:prose-invert max-w-none text-sm whitespace-pre-line">{s.body}</div>

                                {/* Add helpful sub-steps for specific sections */}
                                {s.id === 'products' && (
                                    <ol className="mt-4 list-decimal list-inside text-sm">
                                        <li>Add product name, cost price and selling price.</li>
                                        <li>Assign category and department for better grouping.</li>
                                        <li>Save — product will appear in the product grid and be counted in stock.</li>
                                    </ol>
                                )}

                                {s.id === 'sales' && (
                                    <ol className="mt-4 list-decimal list-inside text-sm">
                                        <li>Use the Sell button on any product card for quick single-item sale.</li>
                                        <li>Or add multiple products to cart, then click Cart → Checkout to complete a multi-item sale.</li>
                                        <li>After sale, stock is reduced and the sale appears in Sales History.</li>
                                    </ol>
                                )}

                                {s.id === 'staff' && (
                                    <div className="mt-4 text-sm">
                                        <p>Permissions you can assign include (example):</p>
                                        <ul className="list-disc list-inside">
                                            <li>products view</li>
                                            <li>products edit</li>
                                            <li>sales view</li>
                                            <li>sales creation</li>
                                            <li>categories management</li>
                                        </ul>
                                        <p className="mt-2">When staff signs in with their 6-digit code, they receive limited access based on these permissions.</p>
                                    </div>
                                )}
                            </Accordion>
                        ))}
                    </div>
                    <footer className="text-center text-sm text-gray-500 dark:text-gray-400 mt-10">Need a custom walkthrough or PDF export? Contact our developer or export this page using the Print button.</footer>
                    <Link to="/support" className="text-blue-500 flex justify-center font-semibold">Contact Us</Link>
                </div>
            </div>
        </>
    );
}


// --------------------------
// Accordion helper component
// --------------------------

function Accordion({ id, title, children, defaultOpen = false }) {
    const [open, setOpen] = React.useState(defaultOpen);
    return (
        <div id={id} className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
            <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between gap-4">
                <div className="text-left">
                    <h3 className="font-semibold">{title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">{open ? 'Open' : 'Click to expand'}</p>
                </div>
                <motion.div animate={{ rotate: open ? 180 : 0 }} className="text-gray-500">
                    <FaChevronDown />
                </motion.div>
            </button>

            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }} transition={{ duration: 0.3 }} className="overflow-hidden mt-4">
                {open && <div className="pt-2">{children}</div>}
            </motion.div>
        </div>
    );
}

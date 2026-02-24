import React, { useEffect, useState } from "react";
import { auth } from "../firebase/config";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Logo from "../images/me2sell-logo.png";
import { FiLogIn, FiLogOut } from "react-icons/fi";
import { HiUserAdd } from "react-icons/hi";
import { MdSpaceDashboard } from "react-icons/md";
import {
    FaEnvelope,
    FaPhoneAlt,
    FaWhatsapp,
    FaLifeRing,
    FaChevronDown,
    FaPaperPlane,
} from "react-icons/fa";

export default function Support() {
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
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                <div className="max-w-6xl mx-auto p-6">

                    {/* ---------------- HERO ---------------- */}
                    <motion.section
                        initial={{ opacity: 0, y: -15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="text-center py-12"
                    >
                        <h1 className="text-3xl md:text-4xl font-extrabold">
                            Me2sell Support Center
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300 mt-3 text-sm md:text-base">
                            Need help? We're always here to assist you.
                        </p>
                    </motion.section>

                    {/* ---------------- CONTACT GRID ---------------- */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10"
                    >
                        <ContactCard
                            icon={<FaEnvelope className="w-6 h-6" />}
                            title="Email Support"
                            text="Reply within 24 hours"
                            link="mailto:enyotronics@gmail.com"
                        />

                        <ContactCard
                            icon={<FaPhoneAlt className="w-6 h-6" />}
                            title="Call Us"
                            text="+234 8163714147"
                            link="tel:+2348163714147"
                        />

                        <ContactCard
                            icon={<FaWhatsapp className="w-7 h-7" />}
                            title="WhatsApp"
                            text="Chat with support"
                            link="https://wa.me/2348163714147"
                        />

                        <ContactCard
                            icon={<FaLifeRing className="w-6 h-6" />}
                            title="Help Center"
                            text="Guides & tutorials"
                            link="/how-it-works"
                        />
                    </motion.div>

                    {/* ---------------- QUICK HELP PANEL ---------------- */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="bg-white dark:bg-gray-800 shadow rounded-xl p-6 mb-10"
                    >
                        <h2 className="text-xl font-bold mb-4">Common Issues</h2>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                                I can't add products
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                                My sales are not updating automatically
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                                Staff cannot log in with their code
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                                I forgot my admin password
                            </li>
                        </ul>
                    </motion.div>

                    {/* ---------------- FAQ ---------------- */}
                    <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
                    <div className="space-y-3 mb-12">
                        <FAQ
                            question="How do I add a new staff?"
                            answer="Go to Dashboard → Staff → Add Staff. Assign permissions and generate a login code."
                        />
                        <FAQ
                            question="Does Me2sell work offline?"
                            answer="Me2sell requires internet to sync data in real-time across devices."
                        />
                        <FAQ
                            question="How do I recover my staff login code?"
                            answer="Only the Admin can view or regenerate a staff login code from the Staff page."
                        />
                        <FAQ
                            question="Can I change my currency or country later?"
                            answer="Yes, go to Profile → Business Info to update your country or currency."
                        />
                    </div>

                    <footer className="text-center text-sm text-gray-500 dark:text-gray-400 pb-6">
                        © {new Date().getFullYear()} Me2sell — All rights reserved.
                    </footer>
                </div>
            </div>
        </>
    );
}

/* =======================
  REUSABLE COMPONENTS
======================= */

function ContactCard({ icon, title, text, link }) {
    return (
        <motion.a
            whileHover={{ y: -6 }}
            href={link}
            className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 flex flex-col items-center text-center gap-3 hover:shadow-lg transition"
        >
            <div className="bg-blue-600 text-white p-3 rounded-full">{icon}</div>
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">{text}</p>
        </motion.a>
    );
}

function FAQ({ question, answer }) {
    const [open, setOpen] = React.useState(false);
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <button
                onClick={() => setOpen(!open)}
                className="flex justify-between items-center w-full"
            >
                <span className="font-semibold">{question}</span>
                <motion.div animate={{ rotate: open ? 180 : 0 }}>
                    <FaChevronDown className="text-gray-500" />
                </motion.div>
            </button>

            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden mt-3"
            >
                <p className="text-sm text-gray-600 dark:text-gray-300">{answer}</p>
            </motion.div>
        </div>
    );
}

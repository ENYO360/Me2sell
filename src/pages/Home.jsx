import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { auth } from "../firebase/config";
import { FaChartLine, FaStore, FaCashRegister, FaUsers } from "react-icons/fa";
import { FiLogIn, FiLogOut } from "react-icons/fi";
import { HiUserAdd } from "react-icons/hi";
import { MdSpaceDashboard, MdSell } from "react-icons/md";
import { useMode } from "../context/UserModeContext";
import BuyerLanding from "./BuyerHome";
import Logo from "../images/me2sell-logo.png";
import EnyotronicsLogo from "../images/enyotronics-logo.png"
import SalebookIllustration from "../images/salesbook-illustration2.png"

export default function Landing() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const menuRef = useRef(null);
  const menuButtonRef = useRef(null);

  const { mode, toggleMode, isSeller, isBuyer } = useMode();

  // 🔄 Listen to auth state changes
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setUser(u);
      setAuthLoading(false);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [menuOpen]);

  const logout = async () => {
    await auth.signOut();
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* HEADER */}
        <header className="w-full py-4 px-6 bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
          <div className="max-w-7xl gap-4 mx-auto flex justify-between items-center">

            {/* Logo */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
              <Link to="/" className="flex items-center gap-2">
                <img src={Logo} alt="Me2sell Logo" className="w-16" />
              </Link>
            </motion.div>

            {/* SELLER / BUYER TOGGLE */}
            <motion.div
              className="hidden md:flex items-center gap-2 bg-gray-100 p-1 rounded-full"
              whileTap={{ scale: 0.95 }}
            >
              <button
                onClick={toggleMode}
                className={`px-4 py-1 rounded-full text-sm font-medium transition ${isSeller
                  ? "bg-blue-600 text-white"
                  : "text-gray-600"
                  }`}
              >
                Seller
              </button>

              <button
                onClick={toggleMode}
                className={`px-4 py-1 rounded-full text-sm font-medium transition ${isBuyer
                  ? "bg-green-600 text-white"
                  : "text-gray-600"
                  }`}
              >
                Buyer
              </button>
            </motion.div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-6 text-[15px] font-medium">
              {authLoading ? null : user ? (
                <>
                  <Link
                    to={isSeller ? "/dashboard" : "/marketplace"}
                    className="flex items-center gap-1 text-gray-700 hover:text-blue-600 transition"
                  >
                    {isSeller ? <MdSpaceDashboard size={20} /> : <MdSell size={20} />} {isSeller ? "Dashboard" : "Marketplace"}
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

            {/* MOBILE MENU BUTTON */}
            <button
              ref={menuButtonRef}
              className="md:hidden text-2xl"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              ☰
            </button>
          </div>
        </header>

        {menuOpen && (
          <motion.div
            ref={menuRef}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0 }}
            className="md:hidden flex items-center justify-between bg-white shadow px-2 py-4 space-y-4"
          >
            {/* MODE TOGGLE (MOBILE) */}
            <motion.div
              className="flex items-center gap-2 bg-gray-100 p-1 rounded-full"
              whileTap={{ scale: 0.95 }}
            >
              <button
                onClick={toggleMode}
                className={`px-4 py-1 rounded-full text-sm font-medium transition ${isSeller
                  ? "bg-blue-600 text-white"
                  : "text-gray-600"
                  }`}
              >
                Seller
              </button>

              <button
                onClick={toggleMode}
                className={`px-4 py-1 rounded-full text-sm font-medium transition ${isBuyer
                  ? "bg-green-600 text-white"
                  : "text-gray-600"
                  }`}
              >
                Buyer
              </button>
            </motion.div>

            {user ? (
              <div className="flex flex-col mx-2 gap-2 w-full items-end">
                <Link
                  to={isSeller ? "/dashboard" : "/marketplace"}
                  onClick={() => setMenuOpen(false)}
                  className="text-gray-700 hover:text-blue-600 transition"
                >
                  {isSeller ? "Dashboard" : "Marketplace"}
                </Link>

                <button
                  onClick={() => {
                    logout();
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 transition"
                >
                  <FiLogOut size={20} /> Logout
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 w-full items-end justify-center mx-2">
                <Link
                  onClick={() => setMenuOpen(false)}
                  to="/login"
                  className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition"
                >
                  <FiLogIn size={18} /> Login
                </Link>

                <Link
                  onClick={() => setMenuOpen(false)}
                  to="/signup"
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm"
                >
                  <HiUserAdd size={20} /> SignUp
                </Link>
              </div>
            )}
          </motion.div>
        )}


        {/* ===================== HERO SECTION ===================== */}
        <>
          {isBuyer ?
            <BuyerLanding user={user} />
            :
            <div>
              <section className="flex flex-col md:flex-row items-center justify-between px-12 mt-16 gap-10">

                {/* LEFT TEXT */}
                <motion.div
                  initial={{ opacity: 0, x: -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  className="max-w-lg"
                >
                  <h2 className="text-5xl md:text-6xl font-extrabold leading-tight bg-gradient-to-r from-blue-700 to-blue-500 text-transparent bg-clip-text">
                    Your Smart Business
                    <br /> Record Book
                  </h2>

                  <p className="mt-4 text-gray-600 text-lg leading-relaxed">
                    Manage your sales, record transactions, track inventory, and monitor staff effortlessly.
                    Me2sell is your all-in-one business management solution.
                  </p>

                  <div className="mt-6 flex gap-4">
                    <Link
                      to={user ? "/dashboard" : "/signup"}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition shadow-md"
                    >
                      Get Started
                    </Link>

                    {!user && (
                      <Link
                        to="/login"
                        className="border border-blue-600 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition"
                      >
                        Login
                      </Link>
                    )}
                  </div>
                </motion.div>

                {/* RIGHT IMAGE (NEW RECORD BOOK IMAGE) */}
                <motion.img
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  src={SalebookIllustration}
                  alt="Record Book Illustration"
                  className="w-80 md:w-[420px]"
                />
              </section>

              {/* ===================== FEATURES ===================== */}
              <section className="mt-12 px-12 text-center">
                <motion.h3
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-3xl font-bold text-gray-800"
                >
                  Why Choose Me2sell?
                </motion.h3>

                <p className="mt-2 text-gray-600">
                  Simple, powerful tools to help you grow your business.
                </p>

                <div className="grid md:grid-cols-4 gap-8 mt-12">

                  {/* Feature 1 */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition cursor-pointer"
                  >
                    <FaStore className="text-blue-600 text-4xl mx-auto" />
                    <h4 className="mt-4 font-semibold text-lg">Product Management</h4>
                    <p className="text-gray-600 mt-2 text-sm">
                      Add, categorize and track all inventory easily.
                    </p>
                  </motion.div>

                  {/* Feature 2 */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition cursor-pointer"
                  >
                    <FaCashRegister className="text-blue-600 text-4xl mx-auto" />
                    <h4 className="mt-4 font-semibold text-lg">Quick Sales Recording</h4>
                    <p className="text-gray-600 mt-2 text-sm">
                      Fast and intuitive sales checkout.
                    </p>
                  </motion.div>

                  {/* Feature 3 */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition cursor-pointer"
                  >
                    <FaUsers className="text-blue-600 text-4xl mx-auto" />
                    <h4 className="mt-4 font-semibold text-lg">Staff Management</h4>
                    <p className="text-gray-600 mt-2 text-sm">
                      Assign roles & track staff performance.
                    </p>
                  </motion.div>

                  {/* Feature 4 */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition cursor-pointer"
                  >
                    <FaChartLine className="text-blue-600 text-4xl mx-auto" />
                    <h4 className="mt-4 font-semibold text-lg">Business Insights</h4>
                    <p className="text-gray-600 mt-2 text-sm">
                      Clear financial insights at a glance.
                    </p>
                  </motion.div>
                </div>
              </section>

              <div className="mt-12 flex justify-center">
                <Link to="/how-it-works" className="text-lg hover:bg-green-300 max-w-36 bg-green-500 p-3 text-white rounded-lg">
                  How it works
                </Link>
              </div>
            </div>
          }
        </>

        {/* FOOTER */}
        <footer className="mt-12 py-6 text-center bg-gray-100 text-gray-600">
          <div className="flex gap-4 mb-1 items-center justify-center flex-wrap">
            <div className="flex items-center ">
              <p className="text-xs">Powerd By: </p>
              <Link to="/enyotronics">
                <img src={EnyotronicsLogo} alt="Enyotronics logo" className="mx-2 w-24" />
              </Link>
            </div>
            <Link to="/support" className="text-blue-500 font-semibold">Contact Us</Link>
          </div>
          <p>© {new Date().getFullYear()} Me2sell — Smart Business Management</p>
        </footer>
      </div>
    </>
  );
}

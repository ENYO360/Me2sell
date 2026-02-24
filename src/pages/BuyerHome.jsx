import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import BuyerImg from "../images/buy.png"
import { FaPhoneAlt, FaWhatsapp, FaStore, FaSearch } from "react-icons/fa";

export default function BuyerLanding({ user }) {
    return (
        <>
            {/* HERO */}
            <section className="flex flex-col md:flex-row items-center justify-between px-6 md:px-12 mt-16 gap-12">
                {/* TEXT */}
                <motion.div
                    initial={{ opacity: 0, x: -40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="max-w-xl"
                >
                    <h1 className="text-5xl md:text-6xl font-extrabold leading-tight bg-gradient-to-r from-green-600 to-blue-600 text-transparent bg-clip-text">
                        Discover Products
                        <br /> From Trusted Sellers
                    </h1>

                    <p className="mt-5 text-gray-600 text-lg leading-relaxed">
                        Browse real products from real businesses.
                        View details, check seller profiles and contact sellers instantly via call or WhatsApp.
                    </p>

                    <div className="mt-8 flex flex-wrap gap-4">
                        <Link
                            to="/marketplace"
                            className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition shadow-md"
                        >
                            Browse Marketplace
                        </Link>
                    </div>
                </motion.div> 

                {/* IMAGE */}
                <motion.img 
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    src={BuyerImg}
                    alt="Marketplace Illustration"
                    className="w-80 md:w-[420px]"
                />
            </section>

            {/* HOW IT WORKS */}
            <section className="mt-24 px-6 md:px-12 text-center">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-3xl font-bold text-gray-800"
                >
                    How It Works
                </motion.h2>

                <div className="grid md:grid-cols-3 gap-10 mt-14">
                    {/* STEP 1 */}
                    <motion.div whileHover={{ scale: 1.05 }} className="bg-white p-6 rounded-xl shadow-md">
                        <FaSearch className="text-green-600 text-4xl mx-auto" />
                        <h4 className="mt-4 font-semibold text-lg">Browse Products</h4>
                        <p className="text-gray-600 mt-2 text-sm">
                            Explore products by category, department or seller.
                        </p>
                    </motion.div>
                    {/* STEP 2 */}
                    <motion.div whileHover={{ scale: 1.05 }} className="bg-white p-6 rounded-xl shadow-md">
                        <FaStore className="text-green-600 text-4xl mx-auto" />
                        <h4 className="mt-4 font-semibold text-lg">View Seller Info</h4>
                        <p className="text-gray-600 mt-2 text-sm">
                            See business details, location and available products.
                        </p>
                    </motion.div>

                    {/* STEP 3 */}
                    <motion.div whileHover={{ scale: 1.05 }} className="bg-white p-6 rounded-xl shadow-md">
                        <FaWhatsapp className="text-green-600 text-4xl mx-auto" />
                        <h4 className="mt-4 font-semibold text-lg">Contact Seller</h4>
                        <p className="text-gray-600 mt-2 text-sm">
                            Call or message sellers directly on WhatsApp.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* CTA */}
            <section className="mt-24 px-6 md:px-12 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-10 rounded-2xl"
                >
                    <h3 className="text-3xl font-bold">
                        Find What You Need — Faster
                    </h3>
                    <p className="mt-3 opacity-90">
                        Connect with local sellers instantly. No middlemen.
                    </p>

                    <Link
                        to={user ? "/marketplace" : "/signup"}
                        className="inline-block mt-6 bg-white text-green-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
                    >
                        {user ? "Start Browsing" : "Get Started"}
                    </Link>
                </motion.div>
            </section>
        </>
    );
}

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { auth } from "../firebase/config";
import { FaTools, FaCode, FaLaptopCode, FaRocket, FaPhone, FaEnvelope, FaFacebookF, FaInstagram, FaLinkedinIn } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { Link } from "react-router-dom";
import Logo from "../images/sales-book.png";
import { FiLogIn, FiLogOut } from "react-icons/fi";
import { HiUserAdd } from "react-icons/hi";
import { MdSpaceDashboard } from "react-icons/md";
import EnyotronicsLogo from "../images/enyotronics-logo.png";
import EnyotronicsHero from "../images/enyotronics-hero.png";
import MosesPics from "../images/moses.jpg";

export default function EnyotronicsPage() {
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
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white">

                {/* HEADER */}
                <header className="w-full p-4 bg-white dark:bg-gray-800 shadow fixed top-0 left-0 z-20">
                    <div className="max-w-6xl mx-auto flex justify-between items-center">
                        <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-2 cursor-pointer">
                            <img src={EnyotronicsLogo} alt="Enyotronics Logo" className="w-28 h-8 rounded" />
                        </motion.div>
                        <Link to="/" className="font-semibold">Me2sell</Link>
                    </div>
                </header>

                {/* HERO SECTION */}
                <section className="pt-28 mt-12 pb-20 px-6 flex flex-col md:flex-row items-center max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        className="flex-1"
                    >
                        <h2 className="text-4xl text-center md:text-left md:text-5xl font-extrabold leading-tight">
                            Building Smart, Powerful & Modern Digital Experiences.
                        </h2>
                        <p className="mt-4 text-center md:text-left text-lg text-gray-700 dark:text-gray-300">
                            Enyotronics specializes in delivering top‑quality software, mobile apps, websites, UI/UX design, business automation, and custom digital solutions tailored to individuals and businesses.
                        </p>
                    </motion.div>

                    <motion.img
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        src={EnyotronicsHero}
                        alt="development illustration"
                        className="w-72 md:w-96 mt-10 md:mt-0"
                    />
                </section>

                {/* SERVICES */}
                <section className="py-20 px-6 bg-white dark:bg-gray-800">
                    <div className="max-w-6xl mx-auto text-center">
                        <h3 className="text-3xl font-bold">What I Do</h3>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">A breakdown of the high‑quality services I provide</p>

                        <div className="grid gap-8 md:grid-cols-3 mt-12">
                            {[{
                                icon: <FaLaptopCode size={50} className="text-blue-600" />,
                                title: "Web & Mobile App Development",
                                text: "Modern, scalable and beautifully designed applications."
                            }, {
                                icon: <FaCode size={50} className="text-green-500" />,
                                title: "Custom Software Solutions",
                                text: "Unique digital tools tailored for business operations."
                            }, {
                                icon: <FaRocket size={50} className="text-purple-600" />,
                                title: "UI/UX, Branding & Optimization",
                                text: "Clean design, intuitive interfaces and performance tuning."
                            }].map((srv, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 40 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: i * 0.2 }}
                                    viewport={{ once: true }}
                                    className="p-6 rounded-xl shadow bg-gray-50 dark:bg-gray-700"
                                >
                                    <div className="flex justify-center mb-4">{srv.icon}</div>
                                    <h4 className="text-xl font-semibold mb-2">{srv.title}</h4>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm">{srv.text}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ABOUT */}
                <section className="py-20 px-6 max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <motion.img
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6 }}
                            src={MosesPics}
                            alt="developer"
                            className="w-60 h-60 md:w-80 md:h-80 mx-auto rounded-full border-4 border-white shadow-lg"
                        />


                        <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
                            <h3 className="text-3xl font-bold mb-4 text-center md:text-left">Hi, I'm Moses, the Mind Behind Enyotronics</h3>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4 text-center md:text-left">
                                I help individuals and businesses build solutions that solve real problems and scale efficiently. Whether it's mobile apps, custom software, full business management systems, or sleek modern websites. I build it professionally.
                            </p>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-center md:text-left">
                                My goal is simple: **turn your ideas into powerful digital products**.
                            </p>
                        </motion.div>
                    </div>
                </section>

                {/* CONTACT */}
                <section className="py-20 px-8 bg-gray-100 dark:bg-gray-800">
                    <div className="max-w-4xl mx-auto text-center">
                        <h3 className="text-3xl font-bold mb-4">Get In Touch</h3>
                        <p className="text-gray-700 dark:text-gray-300 mb-10">Whether it's a project, collaboration, or support, I'm always available.</p>

                        <div className="flex flex-col md:flex-row justify-center gap-6">
                            <motion.a whileHover={{ scale: 1.05 }} href="tel:+2348163714147" className="flex items-center gap-3 bg-white dark:bg-gray-700 p-4 rounded-xl shadow w-full md:w-auto">
                                <FaPhone className="text-blue-600" />
                                <span>Call Me</span>
                            </motion.a>

                            <motion.a whileHover={{ scale: 1.05 }} href="mailto:enyotronics@gmail.com" className="flex items-center gap-3 bg-white dark:bg-gray-700 p-4 rounded-xl shadow w-full md:w-auto">
                                <FaEnvelope className="text-green-600" />
                                <span>Email Me</span>
                            </motion.a>
                        </div>
                    </div>

                    {/* SOCIAL LINKS */}
                    <div className="mt-12 flex justify-center gap-6">
                        <motion.a
                            whileHover={{ scale: 1.15 }}
                            href="https://facebook.com/profile.php?id=100063743297934"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-12 h-12 flex items-center justify-center rounded-full bg-white dark:bg-gray-700 shadow text-blue-600"
                        >
                            <FaFacebookF size={20} />
                        </motion.a>

                        <motion.a
                            whileHover={{ scale: 1.15 }}
                            href="https://www.instagram.com/enyotronics_"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-12 h-12 flex items-center justify-center rounded-full bg-white dark:bg-gray-700 shadow text-pink-600"
                        >
                            <FaInstagram size={20} />
                        </motion.a>

                        <motion.a
                            whileHover={{ scale: 1.15 }}
                            href="https://x.com/MosesEnyo"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-12 h-12 flex items-center justify-center rounded-full bg-white dark:bg-gray-700 shadow text-black dark:text-white"
                        >
                            <FaXTwitter size={20} />
                        </motion.a>

                        <motion.a
                            whileHover={{ scale: 1.15 }}
                            href="https://www.linkedin.com/in/moses-shaibu-430973264/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-12 h-12 flex items-center justify-center rounded-full bg-white dark:bg-gray-700 shadow text-blue-700"
                        >
                            <FaLinkedinIn size={20} />
                        </motion.a>
                    </div>

                </section>

                {/* FOOTER */}
                <footer className="py-6 text-center text-gray-600 dark:text-gray-400 text-sm">
                    © {new Date().getFullYear()} Enyotronics — Digital Solutions That Transform.
                </footer>

            </div>
        </>
    );
}

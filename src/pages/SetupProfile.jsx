import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { db, auth } from "../firebase/config";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { FaUser, FaPhone, FaBuilding, FaMapMarkerAlt, FaMoneyBill } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import CountrySelect from "./dashboard/CountrySelect";
import CurrencySelect from "./dashboard/CurrencySelect";

export default function ProfileSetup() {
  const user = auth.currentUser;
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Admin Profile
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const email = user?.email || "";

  // Business Info
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [country, setCountry] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [currency, setCurrency] = useState("");

  // Validation errors
  const [errors, setErrors] = useState({});

  const validateStep1 = () => {
    let err = {};
    if (!fullName.trim()) err.fullName = "Full name is required";
    if (!phone.trim()) err.phone = "Phone number is required";

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const validateStep2 = () => {
    let err = {};
    if (!businessName.trim()) err.businessName = "Business name is required";
    if (!businessType.trim()) err.businessType = "Business type is required";
    if (!country.trim()) err.country = "Country is required";
    if (!businessAddress.trim()) err.businessAddress = "Business address is required";

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;

    try {
      setLoading(true);

      await setDoc(doc(db, "businessProfiles", user.uid), {
        admin: {
          fullName,
          phone,
          email,
        },
        business: {
          businessName,
          businessType,
          country,
          businessAddress,
          currency,
        },
        createdAt: new Date(),
      });

      navigate("/dashboard");

    } catch (err) {
      alert("Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10 flex justify-center">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-white p-8 rounded-xl shadow-lg"
      >
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Complete Your Business Profile
        </h1>

        {/* STEP INDICATOR */}
        <div className="flex justify-center mb-8">
          <div className="flex gap-4">
            <div className={`w-10 h-10 flex items-center justify-center rounded-full font-bold 
                ${step === 1 ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-600"}`}>
              1
            </div>
            <div className={`w-10 h-10 flex items-center justify-center rounded-full font-bold 
                ${step === 2 ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-600"}`}>
              2
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* STEP 1 – ADMIN PROFILE */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="text-lg font-semibold text-blue-600 mb-3">Admin Profile</h2>

              {/* Full Name */}
              <div className="mb-4">
                <label className="font-medium flex items-center gap-2">
                  <FaUser /> Full Name
                </label>
                <input
                  type="text"
                  className="mt-1 p-3 border rounded w-full"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
                {errors.fullName && <p className="text-red-500 text-sm">{errors.fullName}</p>}
              </div>

              {/* Phone */}
              <div className="mb-4">
                <label className="font-medium flex items-center gap-2">
                  <FaPhone /> Phone Number
                </label>
                <input
                  type="text"
                  className="mt-1 p-3 border rounded w-full"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <p className="pl-2 text-xs text-gray-700">Format: +1234567890</p>
                {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
              </div>

              {/* Email (Read-only) */}
              <div className="mb-4">
                <label className="font-medium flex items-center gap-2">
                  <MdEmail /> Email Address
                </label>
                <input
                  type="email"
                  disabled
                  className="mt-1 p-3 border rounded w-full bg-gray-100"
                  value={email}
                />
              </div>

              <button
                type="button"
                onClick={() => validateStep1() && setStep(2)}
                className="w-full bg-blue-600 text-white py-3 rounded-lg mt-4 hover:bg-blue-700"
              >
                Continue →
              </button>
              <Link to="/marketplace" className="flex justify-center mt-3 text-blue-600 hover:underline">Skip</Link>
            </motion.div>
          )}

          {/* STEP 2 – BUSINESS INFORMATION */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="text-lg font-semibold text-blue-600 mb-3">
                Business Information
              </h2>

              {/* Business Name */}
              <div className="mb-4">
                <label className="font-medium flex items-center gap-2">
                  <FaBuilding /> Business Name
                </label>
                <input
                  type="text"
                  className="mt-1 p-3 border rounded w-full"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                />
                {errors.businessName && <p className="text-red-500 text-sm">{errors.businessName}</p>}
              </div>

              {/* Business Type */}
              <div className="mb-4">
                <label className="font-medium flex items-center gap-2">
                  <FaBuilding /> Business Type
                </label>
                <input
                  type="text"
                  className="mt-1 p-3 border rounded w-full"
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                />
                {errors.businessType && <p className="text-red-500 text-sm">{errors.businessType}</p>}
              </div>

              {/* Country */}
              <div className="mb-4">
                <label className="font-medium flex items-center gap-2">
                  <FaMapMarkerAlt /> Country
                </label>
                <CountrySelect
                  className="mt-1 p-3 border rounded w-full"
                  value={country}
                  onChange={(value) => setCountry(value)}
                />
                {errors.country && <p className="text-red-500 text-sm">{errors.country}</p>}
              </div>

              {/* Business Address */}
              <div className="mb-4">
                <label className="font-medium flex items-center gap-2">
                  <FaMapMarkerAlt /> Business Address
                </label>
                <input
                  type="text"
                  className="mt-1 p-3 border rounded w-full"
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                />
                {errors.businessAddress && (
                  <p className="text-red-500 text-sm">{errors.businessAddress}</p>
                )}
              </div>

              {/* Currency */}
              <div className="mb-4">
                <label className="font-medium flex items-center gap-2">
                  <FaMoneyBill /> Currency
                </label>
                <CurrencySelect
                  className="mt-1 p-3 border rounded w-full"
                  value={currency}
                  onChange={(value) => setCurrency(value)}
                />
                {errors.currency && <p className="text-red-500 text-sm">{errors.currency}</p>}
              </div>

              {/* BUTTONS */}
              <div className="flex justify-between mt-6">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400"
                >
                  ← Back
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                >
                  {loading ? "Saving..." : "Finish"}
                </button>
              </div>
            </motion.div>
          )}
        </form>
      </motion.div>
    </div>
  );
}

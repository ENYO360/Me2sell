import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase/config";
import { doc, setDoc } from "firebase/firestore";
import ThemeToggle from "../components/ThemeToggle";
import CountrySelect from "./dashboard/CountrySelect";
import { FaEye } from "react-icons/fa";
import { IoMdEyeOff } from "react-icons/io"

const Signup = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();

    // Start loading immediately
    setLoading(true);
    setErrorMsg("");

    // Password validation
    if (password.length < 8) {
      setLoading(false);
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);

      await setDoc(doc(db, "users", userCred.user.uid), {
        businessName,
        email,
        createdAt: new Date(),
      });

      navigate("/setup-profile");
    } catch (error) {
      let msg = "";

      if (error.code === "auth/email-already-in-use") {
        msg = "This email is already registered. Login to continue";
      } else if (error.code === "auth/invalid-email") {
        msg = "Please enter a valid email address.";
      } else if (error.code === "auth/weak-password") {
        msg = "Password should be at least 6 characters.";
      } else {
        msg = "An error occurred. Please try again.";
      }

      setErrorMsg(msg);
    } finally {
      // Stop loading AFTER everything completes (success or fail)
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">

      {/* Theme toggle button */}
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-sm animate-fadeIn">
        <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white">
          Create Account
        </h2>
        <p className="text-center text-gray-500 dark:text-gray-300 mb-6">
          Start managing your business
        </p>

        {errorMsg && (
          <p className="mb-3 text-red-500 text-center text-sm">{errorMsg}</p>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          {/* Email */}
          <div>
            <label className="text-gray-700 dark:text-gray-200">Email</label>
            <input
              type="email"
              className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 
                         text-gray-900 dark:text-white outline-none focus:ring-2 
                         focus:ring-blue-400 transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password with toggle */}
          <div>
            <label className="text-gray-700 dark:text-gray-200">Password</label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700
                           text-gray-900 dark:text-white outline-none focus:ring-2 
                           focus:ring-blue-400 transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              {/* Toggle Button */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-2 right-3 text-gray-600 dark:text-gray-300"
              >
                {showPassword ? (
                  <FaEye className="w-5 h-5" />
                ) : (
                  <IoMdEyeOff className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Password strength note */}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Minimum 8 characters required.
            </p>
          </div>

          <button className="w-full py-2 bg-blue-600 text-white rounded-lg 
                             hover:bg-blue-700 transition font-semibold shadow-md">
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-4 text-center text-gray-600 dark:text-gray-300">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;

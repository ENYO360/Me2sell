import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { AuthContext } from "../context/AuthContext";
import { auth } from "../firebase/config";
import ThemeToggle from "../components/ThemeToggle";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  // FORM STATES
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  // ERROR STATE
  const [errorMsg, setErrorMsg] = useState("");

  // FORM VALIDATION
  const validateForm = () => {
    if (!email.trim()) return "Email is required.";
    if (!/\S+@\S+\.\S+/.test(email)) return "Enter a valid email address.";

    if (!password.trim()) return "Password is required.";
    if (password.length < 8)
      return "Password must be at least 8 characters long.";

    return null;
  };

  // FIREBASE ERROR MESSAGE HANDLER
  const handleFirebaseError = (err) => {
    const message = err.message || "";
    const code = err.code || "";

    // Extract deeper Firebase error code from message e.g. "(auth/wrong-password)"
    const extracted = message.match(/\(auth\/[a-z\-]+\)/);
    const actualCode = extracted ? extracted[0].replace(/[()]/g, "") : code;

    switch (actualCode) {
      case "auth/user-not-found":
        return "No account found with this email.";

      case "auth/wrong-password":
        return "Incorrect password. Try again.";

      case "auth/invalid-email":
        return "Invalid email format.";

      case "auth/invalid-credential":
        return "Incorrect email or password.";

      case "auth/too-many-requests":
        return "Too many attempts. Please wait and try again.";

      default:
        return "Login failed. Please try again.";
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true)

    const validationError = validateForm();
    if (validationError) {
      setErrorMsg(validationError);
      setLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setErrorMsg(handleFirebaseError(err));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">

      {/* Theme button */}
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-[380px]">

        <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white">
          Welcome Back
        </h2>
        <p className="text-center text-gray-500 dark:text-gray-300 mb-6">
          Login to continue
        </p>

        {/* ERROR MESSAGE */}
        {errorMsg && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 animate-shake">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">

          {/* EMAIL */}
          <div>
            <label className="text-gray-700 dark:text-gray-200">Email</label>
            <input
              type="email"
              className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label className="text-gray-700 dark:text-gray-200">Password</label>

            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {/* SHOW/HIDE ICON */}
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-3 text-gray-600 dark:text-gray-300"
              >
                {showPass ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* LOGIN BUTTON */}
          <button
            type="submit"
            className={`w-full py-2 ${loading ? "bg-blue-300" : "bg-blue-600"} text-white rounded-lg hover:bg-blue-700 transition-all`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <Link
          to="/forgot-password"
          className="text-sm mt-2 flex justify-center text-blue-600 hover:underline"
        >
          Forgot password?
        </Link>

        <p className="mt-4 text-center text-gray-600 dark:text-gray-300">
          Don't have an account?{" "}
          <Link to="/signup" className="text-blue-600 hover:underline">
            Register
          </Link>
        </p>

      </div>
    </div>
  );
}

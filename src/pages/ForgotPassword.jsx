import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase/config";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");

      await sendPasswordResetEmail(auth, email);

      setMessage("Password reset link sent! Check your email inbox.");
    } catch (err) {
      console.error(err);

      switch (err.code) {
        case "auth/user-not-found":
          setError("No account found with this email");
          break;
        case "auth/invalid-email":
          setError("Invalid email address");
          break;
        default:
          setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={handleReset}
        className="bg-white p-6 rounded-xl shadow-md w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-4">Reset Password</h2>

        <p className="text-sm text-gray-600 mb-4">
          Enter your email and we’ll send you a password reset link.
        </p>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        {message && <p className="text-green-600 text-sm mb-3">{message}</p>}

        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 border rounded-lg mb-4 focus:outline-none focus:ring"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>

        <div className="text-sm mt-4 flex justify-between">
          <Link to="/login" className="text-blue-600 hover:underline">
            Back to Login
          </Link>
          <Link to="/signup" className="text-blue-600 hover:underline">
            Create Account
          </Link>
        </div>
      </form>
    </div>
  );
}

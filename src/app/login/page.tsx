"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import API from "@/lib/api";
import toast from "react-hot-toast";
import { useAuth } from "@/context/authContext";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { setIsLoggedIn, setRole } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await API.post("/auth/login", { email, password });
      const token = res.data.token;
      localStorage.setItem("token", token);

      const profile = await API.get("/auth/me");
      setIsLoggedIn(true);
      setRole(profile.data.role);

      router.push(profile.data.role === "ADMIN" ? "/admin" : "/dashboard");
    } catch (err) {
      console.error("Login failed:", err);
      toast.error("Login failed. Check credentials.");
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-950 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-3xl bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 space-y-6"
      >
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white">
          🔐 Login to Your Account
        </h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="flex gap-4">
            <input
              type="email"
              placeholder="Email"
              className="flex-1 border p-3 rounded-md text-gray-900 dark:text-white dark:bg-gray-800"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="flex-1 border p-3 rounded-md text-gray-900 dark:text-white dark:bg-gray-800"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-3 rounded-md font-semibold hover:bg-blue-700 transition"
          >
            🚀 Login
          </button>
        </form>

        <p className="text-center text-sm text-gray-700 dark:text-gray-300">
          👤 Don't have an account?{" "}
          <button
            onClick={() => router.push("/register")}
            className="text-blue-600 hover:underline font-medium"
          >
            Register
          </button>
        </p>

        <div className="pt-4 border-t border-gray-300 dark:border-gray-700 space-y-4">
          <div className="text-center text-lg font-semibold text-gray-800 dark:text-gray-100">
            🧪 Use Demo Accounts
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="border p-4 rounded-xl shadow-sm bg-gray-50 dark:bg-gray-800">
              <h3 className="font-medium text-gray-800 dark:text-gray-100">
                🎯 User Email:{" "}
                <span className="font-mono">lewandowski@gmail.com</span>
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                🔐 Password: <span className="font-mono">lewandowski</span>
              </p>
            </div>

            <div className="border p-4 rounded-xl shadow-sm bg-gray-50 dark:bg-gray-800">
              <h3 className="font-medium text-gray-800 dark:text-gray-100">
                🛡️ Admin Email: <span className="font-mono">hansi@gmail.com</span>
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                🔐 Password: <span className="font-mono">hansi</span>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

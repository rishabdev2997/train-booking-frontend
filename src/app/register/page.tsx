"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "@/lib/api";
import { motion } from "framer-motion";

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [role, setRole] = useState("USER");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("/auth/register", {
        firstName,
        lastName,
        email,
        password,
        phone,
        address,
        role,
      });
      router.push("/login");
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 to-green-300 dark:from-gray-900 dark:to-gray-800 px-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-3xl bg-white dark:bg-gray-900 shadow-xl rounded-2xl p-10 border dark:border-gray-700"
      >
        <h2 className="text-3xl font-bold text-center mb-6 text-gray-800 dark:text-white">
          📝 Register
        </h2>

        {error && (
          <p className="text-red-500 text-sm mb-4 text-center font-medium">
            {error}
          </p>
        )}

        <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="First Name"
            className="border p-3 rounded-md dark:bg-gray-800 dark:text-white"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Last Name"
            className="border p-3 rounded-md dark:bg-gray-800 dark:text-white"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email"
            className="border p-3 rounded-md dark:bg-gray-800 dark:text-white"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="border p-3 rounded-md dark:bg-gray-800 dark:text-white"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Phone"
            className="border p-3 rounded-md dark:bg-gray-800 dark:text-white"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Address"
            className="border p-3 rounded-md dark:bg-gray-800 dark:text-white col-span-1 md:col-span-2"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
          <select
            className="border p-3 rounded-md dark:bg-gray-800 dark:text-white col-span-1 md:col-span-2"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
          >
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
          </select>

          <button
            type="submit"
            className="col-span-1 md:col-span-2 mt-4 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-md transition duration-300"
          >
            ✅ Create Account
          </button>
        </form>
      </motion.div>
    </div>
  );
}

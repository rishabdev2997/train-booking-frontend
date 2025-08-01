'use client';
import { motion } from 'framer-motion';

export default function HeroSection() {
  return (
    <section className="w-full py-8">
      <div className="max-w-4xl mx-auto px-4 flex flex-col items-center text-center space-y-4">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white"
        >
          🚄 Book Your Journey in Seconds
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-base md:text-lg text-gray-700 dark:text-gray-300 max-w-xl"
        >
          Welcome to Train Booking – your all-in-one platform to search, view, and book train tickets quickly and easily.
        </motion.p>
      </div>
    </section>
  );
}

'use client';
import Link from 'next/link';
import { useAuth } from '@/context/authContext';

export default function Navbar() {
  const { isLoggedIn, setIsLoggedIn, role, setRole } = useAuth();

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setRole(null);
    window.location.href = '/login'; // or router.replace('/login')
  };

  return (
    <nav className="flex justify-between p-4 bg-gray-100 shadow-md">
      <Link href="/" className="text-xl font-bold">Train Booking</Link>
      <div className="space-x-4">
        {isLoggedIn ? (
          <>
            {role === "ADMIN" && <Link href="/admin">Admin Dashboard</Link>}
            {role === "USER" && <Link href="/dashboard">Dashboard</Link>}
            <button onClick={handleLogout} className="text-red-600">Logout</button>
          </>
        ) : (
          <>
            <Link href="/login">Login</Link>
            <Link href="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

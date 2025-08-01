import './globals.css';
import Navbar from '@/components/Navbar';
import { Toaster } from "sonner";
import type { Metadata } from 'next';
import { AuthProvider } from '@/context/authContext';

export const metadata: Metadata = {
  title: 'Train Booking',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navbar />
          <Toaster position="top-center" />  {/* ✅ NO reverseOrder for sonner */}
          <main className="p-4">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}

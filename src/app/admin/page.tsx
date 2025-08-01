"use client"
import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import TrainManagement from '@/components/admin/TrainManagement';
import BookingManagement from '@/components/admin/BookingManagement';
import UserManagement from '@/components/admin/UserManagement';
import AdminBookingForm from '@/components/admin/AdminBookingForm';
import SeatManagement from '@/components/admin/SeatManagement';
import { useRouter } from 'next/navigation';
import API from '@/lib/api'; // <-- Assuming you use this for axios/fetch

export default function AdminDashboardPage() {
  const router = useRouter();
  const [tab, setTab] = useState('trains');
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // Auth check and fetch user info
    const fetchUser = async () => {
      try {
        const res = await API.get("/auth/me");
        if (res.data.role !== "ADMIN") {
          // User not admin -- redirect to login or user dashboard
          router.replace("/login");
        } else {
          setUser(res.data);
        }
      } catch {
        setError("Session expired. Redirecting...");
        setTimeout(() => router.push("/login"), 1500);
      }
    }
    fetchUser();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    router.push('/login');
  };
  function capitalizeFirst(str: string) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
}

  if (error) return <div className="p-4">{error}</div>;
  if (!user) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">
          Welcome, {user.email ? capitalizeFirst(user.email.split('@')[0]) : "Admin"}
        </h1>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="trains">Trains</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="create-booking">Book Tickets</TabsTrigger>
          <TabsTrigger value="seat-management">Seat Management</TabsTrigger>
        </TabsList>

        <TabsContent value="trains">
          <TrainManagement />
        </TabsContent>
        <TabsContent value="bookings">
          <BookingManagement role="ADMIN"/>
        </TabsContent>
        <TabsContent value="users">
          <UserManagement role="ADMIN" />
        </TabsContent>
        <TabsContent value="create-booking">
          <AdminBookingForm role="ADMIN"/>
        </TabsContent>
        <TabsContent value="seat-management">
          <SeatManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}

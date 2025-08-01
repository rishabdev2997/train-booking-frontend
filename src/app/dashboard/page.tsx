'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import BookingManagement from '@/components/admin/BookingManagement'; // role-aware
import AdminBookingForm from '@/components/admin/AdminBookingForm';   // role-aware
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import API from '@/lib/api';
import UserManagement from '@/components/admin/UserManagement';

// Helper to capitalize first letter
function capitalizeFirst(str: string) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

export default function Page() {
  const router = useRouter();
  const [tab, setTab] = useState('my-bookings');
  const [user, setUser] = useState<any>(null);
  const [refresh, setRefresh] = useState(0);

  // Fetch current user on mount
  useEffect(() => {
    API.get('/auth/me')
      .then(res => {
        if (res.data.role !== "USER") router.replace("/admin");
        else setUser(res.data);
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    router.push('/login');
  };

  const handleBookingSuccess = () => setRefresh(r => r + 1);

  if (!user) return <div className="p-8">Loading...</div>;

  // Compute username for welcome: use firstName if present, else portion before @ in email
  const username =
    user.firstName && user.firstName.trim()
      ? capitalizeFirst(user.firstName)
      : user.email
        ? capitalizeFirst(user.email.split("@")[0])
        : "User";

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">
          Welcome, {username}
        </h1>
        
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="my-bookings">My Bookings</TabsTrigger>
          <TabsTrigger value="book-ticket">Book Ticket</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="my-bookings">
          <h2 className="text-lg font-semibold my-2">My Bookings</h2>
          <BookingManagement
            role="USER"
            userId={user.id}
            key={refresh}
          />
        </TabsContent>

        <TabsContent value="book-ticket">
          <h2 className="text-lg font-semibold my-2">Book a Ticket</h2>
          <AdminBookingForm
            role="USER"
            onBookingSuccess={handleBookingSuccess}
          />
        </TabsContent>

        <TabsContent value="profile">
          <UserManagement role="USER" currentUserId={user.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

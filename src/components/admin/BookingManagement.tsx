"use client";

import { useState, useEffect } from 'react';
import API from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type Booking = {
  bookingId?: string;
  id: string;
  userFullName?: string;
  userEmail?: string;
  username?: string;
  userId?: string;
  trainNumber?: string;
  trainName?: string;
  trainId?: string;
  date?: string;
  journeyDate?: string;
  seatNumber?: string;
  seats?: string[];
  seatNumbers?: string[];
  status: string;
};

type Train = {
  id: string
  trainNumber: string
  name: string
  source: string
  destination: string
  departureDate?: string
  departureTime?: string
  arrivalTime?: string
  // ...any extra
};

function formatDate(isoDate?: string) {
  if (!isoDate) return '-';
  const [year, month, day] = isoDate.split("T")[0].split("-");
  return `${day}/${month}/${year}`;
}

export default function BookingManagement({
  role = "ADMIN",
  userId: userIdProp,
  onBookingCancelled,
}: {
  role?: "ADMIN" | "USER";
  userId?: string;
  onBookingCancelled?: () => void;
}) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [trains, setTrains] = useState<Train[]>([]);
  const [trainsById, setTrainsById] = useState<{ [id: string]: Train }>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [userId, setUserId] = useState(userIdProp || "");

  // Fetch trains for lookup
  useEffect(() => {
    API.get("/trains").then(res => {
      setTrains(res.data);
      setTrainsById(Object.fromEntries(res.data.map((t: Train) => [t.id, t])));
    });
  }, []);

  // Fetch userId from /auth/me if not passed and role is USER
  useEffect(() => {
    if (role === "USER" && !userId) {
      API.get("/auth/me")
        .then(res => setUserId(res.data.id))
        .catch(() => setUserId(""));
    }
  }, [role, userId]);

  // Fetch bookings
  const fetchBookings = async () => {
    setLoading(true);
    try {
      let res;
      if (role === "USER") {
        if (!userId) return setLoading(false);
        res = await API.get(`/bookings/user/${userId}`);
      } else {
        res = await API.get('/bookings');
      }
      setBookings(res.data.map((b: Booking) => ({
        ...b,
        date: b.date || b.journeyDate,
        seats: b.seats ?? b.seatNumbers ?? (b.seatNumber ? [b.seatNumber] : []),
      })));
    } catch (err) {
      toast.error('Failed to fetch bookings');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if ((role === "USER" && userId) || role === "ADMIN") fetchBookings();
    // eslint-disable-next-line
  }, [role, userId]);

  const handleCancel = async (bookingId: string) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await API.post(`/bookings/${bookingId}/cancel`);
      setBookings(current =>
        current.map(b =>
          (b.bookingId === bookingId || b.id === bookingId)
            ? { ...b, status: 'CANCELLED' } : b
        )
      );
      toast.success('Booking cancelled!');
      if (onBookingCancelled) onBookingCancelled();
    } catch {
      toast.error('Cancel failed');
    }
  };

  const filteredBookings = bookings.filter(b => {
    // Use info from train object in search, too!
    const train = trainsById[b.trainId || ""];
    const trainSearch = train
      ? `${train.trainNumber} ${train.name} ${train.source} ${train.destination}`
      : "";
    const searchString = role === "ADMIN"
      ? `
        ${b.userFullName || ""} ${b.userEmail || ""} ${b.username || ""}
        ${trainSearch}
        ${b.status || ""} ${b.date || ""}
        ${(b.seats || []).join(" ")}
      `.toLowerCase()
      : `
        ${trainSearch}
        ${b.status || ""} ${b.date || ""}
        ${(b.seats || []).join(" ")}
      `.toLowerCase();
    return searchString.includes(search.trim().toLowerCase());
  });

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">
        Booking Management{role === "USER" ? " (My Bookings)" : ""}
      </h2>
      <div className="mb-4 flex items-center gap-2 max-w-md">
        <Input
          placeholder={
            role === "ADMIN"
              ? "Search (user, train, status, date)"
              : "Search (train, status, date)"
          }
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search Bookings"
          disabled={role === "USER" && bookings.length === 0}
        />
        <Button variant="outline" onClick={() => setSearch('')}>Clear</Button>
      </div>
      {loading ? (
        <div>Loading bookings...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border rounded text-sm">
            <thead>
              <tr className="bg-gray-100">
                {role === "ADMIN" && (
                  <th className="p-2 border-b text-left">User</th>
                )}
                <th className="p-2 border-b text-left">Train</th>
                <th className="p-2 border-b text-left">Date</th>
                <th className="p-2 border-b text-left">Seats</th>
                <th className="p-2 border-b text-left">Status</th>
                <th className="p-2 border-b"></th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 && (
                <tr>
                  <td className="py-8 text-center text-gray-400" colSpan={role === "ADMIN" ? 6 : 5}>
                    No bookings found.
                  </td>
                </tr>
              )}
              {filteredBookings.map(b => {
                const train = trainsById[b.trainId || ""];
                return (
                  <tr key={b.bookingId || b.id}>
                    {role === "ADMIN" && (
                      <td className="border-b p-2">
                        {b.userFullName || b.userEmail || b.username || b.userId || 'N/A'}
                      </td>
                    )}
                    <td className="border-b p-2">
                      {/* Show [train no] [src] → [dest] */}
                      {train
                        ? `${train.trainNumber} ${train.source} → ${train.destination}`
                        : b.trainNumber || b.trainName || b.trainId || "N/A"
                      }
                    </td>
                    <td className="border-b p-2">{formatDate(b.date)}</td>
                    <td className="border-b p-2">
                      {b.seats && b.seats.length > 0 ? b.seats.join(', ') : '-'}
                    </td>
                    <td
                      className={`border-b p-2 ${
                        b.status === 'CANCELLED' ? 'text-red-600 font-semibold' : ''
                      }`}
                    >
                      {b.status}
                    </td>
                    <td className="border-b p-2">
                      {b.status !== 'CANCELLED' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleCancel(b.bookingId || b.id)}
                          disabled={!!(role === "USER" && b.userId && userId && b.userId !== userId)}
                        >
                          Cancel
                        </Button>
                        
                      )}
                      
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

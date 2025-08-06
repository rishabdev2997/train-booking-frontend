"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import API from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
  id: string;
  trainNumber: string;
  name: string;
  source: string;
  destination: string;
  departureDate?: string;
  departureTime?: string;
  arrivalTime?: string;
};

// Format ISO date string as dd/mm/yyyy
function formatDate(isoDate?: string) {
  if (!isoDate) return "-";
  const [year, month, day] = isoDate.split("T")[0].split("-");
  return `${day}/${month}/${year}`;
}

interface BookingManagementProps {
  role?: "ADMIN" | "USER";
  userId?: string;
  onBookingCancelled?: () => void;
}

interface BookingRequestDTO {
  trainId: string;
  userId?: string;
  departureDate: string; // yyyy-MM-dd
  seatNumber: string;
  // other fields as required by backend
}

export default function BookingManagement({
  role = "ADMIN",
  userId: userIdProp,
  onBookingCancelled,
}: BookingManagementProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [trains, setTrains] = useState<Train[]>([]);
  const [trainsById, setTrainsById] = useState<Record<string, Train>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [userId, setUserId] = useState(userIdProp || "");

  // Booking creation form state
  const [creatingBooking, setCreatingBooking] = useState(false);
  const [newBooking, setNewBooking] = useState<BookingRequestDTO>({
    trainId: "",
    departureDate: "",
    seatNumber: "",
    userId: userId || undefined,
  });

  // Fetch trains on mount
  useEffect(() => {
    API.get("/trains")
      .then((res) => {
        setTrains(res.data);
        setTrainsById(Object.fromEntries(res.data.map((t: Train) => [t.id, t])));
      })
      .catch(() => toast.error("Failed to load train list"));
  }, []);

  // Fetch current user id if role is USER and not passed as prop
  useEffect(() => {
    if (role === "USER" && !userId) {
      API.get("/auth/me")
        .then((res) => setUserId(res.data.id))
        .catch(() => setUserId(""));
    }
  }, [role, userId]);

  // Fetch bookings (optionally enriched) depending on role
  const fetchBookings = async (enriched = false) => {
    setLoading(true);
    try {
      let res;
      if (role === "USER") {
        if (!userId) {
          setLoading(false);
          return;
        }
        if (enriched) {
          res = await API.get(`/bookings/user/${userId}/enriched`);
        } else {
          res = await API.get(`/bookings/user/${userId}`);
        }
      } else {
        res = await API.get("/bookings");
      }

      setBookings(
        res.data.map((b: Booking) => ({
          ...b,
          date: b.date || b.journeyDate,
          seats:
            b.seats ??
            b.seatNumbers ??
            (b.seatNumber ? [b.seatNumber] : []),
        }))
      );
    } catch {
      toast.error("Failed to fetch bookings");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if ((role === "USER" && userId) || role === "ADMIN") fetchBookings();
  }, [role, userId]);

  // Cancel booking
  const handleCancel = async (bookingId: string) => {
    if (!window.confirm("Cancel this booking?")) return;
    try {
      await API.post(`/bookings/${bookingId}/cancel`);
      setBookings((current) =>
        current.map((b) =>
          b.bookingId === bookingId || b.id === bookingId
            ? { ...b, status: "CANCELLED" }
            : b
        )
      );
      toast.success("Booking cancelled!");
      if (onBookingCancelled) onBookingCancelled();
    } catch {
      toast.error("Cancel failed");
    }
  };

  // Booking creation handlers
  const handleNewBookingChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewBooking((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateBooking = async (e: FormEvent) => {
    e.preventDefault();
    if (
      !newBooking.trainId ||
      !newBooking.departureDate ||
      !newBooking.seatNumber
    ) {
      toast.error("Please fill all booking details");
      return;
    }
    try {
      await API.post("/bookings", newBooking);
      toast.success("Booking created!");
      setCreatingBooking(false);
      setNewBooking({
        trainId: "",
        departureDate: "",
        seatNumber: "",
        userId: userId || undefined,
      });
      fetchBookings();
    } catch {
      toast.error("Booking creation failed");
    }
  };

  // Filter bookings for display
  const filteredBookings = bookings.filter((b) => {
    const train = trainsById[b.trainId || ""];
    const trainSearch = train
      ? `${train.trainNumber} ${train.name} ${train.source} ${train.destination}`
      : "";
    const searchString =
      role === "ADMIN"
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

      {/* Search and filters */}
      <div className="mb-4 flex items-center gap-2 max-w-md">
        <Input
          placeholder={
            role === "ADMIN"
              ? "Search (user, train, status, date)"
              : "Search (train, status, date)"
          }
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search Bookings"
          disabled={role === "USER" && bookings.length === 0}
        />
        <Button variant="outline" onClick={() => setSearch("")}>
          Clear
        </Button>
        {/* Enriched bookings toggle for USER */}
        {role === "USER" && (
          <Button
            variant="secondary"
            onClick={() => fetchBookings(true)}
            className="ml-auto"
          >
            Load Enriched Bookings
          </Button>
        )}
      </div>

      {/* New booking form toggle */}
      {role !== "USER" || (role === "USER" && userId) ? (
        <>
          {!creatingBooking && (
            <Button
              variant="default"
              onClick={() => setCreatingBooking(true)}
              className="mb-4"
            >
              + New Booking
            </Button>
          )}
          {creatingBooking && (
            <form
              onSubmit={handleCreateBooking}
              className="mb-6 p-4 border rounded bg-gray-50 max-w-md space-y-3"
            >
              <h3 className="font-semibold text-lg mb-2">Create New Booking</h3>

              <label className="block">
                <span className="text-sm font-medium">Select Train</span>
                <select
                  name="trainId"
                  value={newBooking.trainId}
                  onChange={handleNewBookingChange}
                  required
                  className="w-full mt-1 p-2 border rounded"
                >
                  <option value="">Select train</option>
                  {trains.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.trainNumber} {t.source} → {t.destination}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium">Journey Date</span>
                <Input
                  type="date"
                  name="departureDate"
                  value={newBooking.departureDate}
                  onChange={handleNewBookingChange}
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium">Seat Number</span>
                <Input
                  type="text"
                  name="seatNumber"
                  value={newBooking.seatNumber}
                  onChange={handleNewBookingChange}
                  placeholder="e.g., 1A"
                  required
                />
              </label>

              <div className="flex gap-2">
                <Button type="submit" variant="default" className="flex-grow">
                  Create Booking
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreatingBooking(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </>
      ) : null}

      {/* Bookings table */}
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
              {filteredBookings.length === 0 ? (
                <tr>
                  <td
                    className="py-8 text-center text-gray-400"
                    colSpan={role === "ADMIN" ? 6 : 5}
                  >
                    No bookings found.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => {
                  const train = trainsById[b.trainId || ""];
                  const isDisabledCancel: boolean =
                        role === "USER" && !!b.userId && !!userId && b.userId !== userId;
                  return (
                    <tr key={b.bookingId || b.id}>
                      {role === "ADMIN" && (
                        <td className="border-b p-2">
                          {b.userFullName ||
                            b.userEmail ||
                            b.username ||
                            b.userId ||
                            "N/A"}
                        </td>
                      )}

                      <td className="border-b p-2">
                        {train
                          ? `${train.trainNumber} ${train.source} → ${train.destination}`
                          : b.trainNumber || b.trainName || b.trainId || "N/A"}
                      </td>

                      <td className="border-b p-2">{formatDate(b.date)}</td>
                      <td className="border-b p-2">
                        {b.seats && b.seats.length > 0 ? b.seats.join(", ") : "-"}
                      </td>

                      <td
                        className={`border-b p-2 ${
                          b.status === "CANCELLED" ? "text-red-600 font-semibold" : ""
                        }`}
                      >
                        {b.status}
                      </td>

                      <td className="border-b p-2">
                        {b.status !== "CANCELLED" && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleCancel(b.bookingId || b.id)}
                            aria-disabled={isDisabledCancel}
                            className={isDisabledCancel ? "opacity-50 pointer-events-none" : ""}
                            title={isDisabledCancel ? "You cannot cancel this booking" : "Cancel Booking"}
                          >
                            Cancel
                          </Button>


                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, ChangeEvent, FormEvent } from "react";
import API from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Seat = {
  id: string;
  trainId: string;
  seatNumber: string;
  date: string; // corresponds to departureDate
  status: string;
};

type Train = {
  id: string;
  trainNumber: string;
  name?: string;
  source: string;
  destination: string;
};

const STATUS_OPTIONS = ["AVAILABLE", "BOOKED"];

export default function SeatManagement() {
  const [trains, setTrains] = useState<Train[]>([]);
  const [trainId, setTrainId] = useState("");
  const [date, setDate] = useState("");
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchSeat, setSearchSeat] = useState("");
  const [searchStatus, setSearchStatus] = useState("");
  // We keep searchTrainNumber but do not show an input for it; managed automatically
  const [searchTrainNumber, setSearchTrainNumber] = useState("");

  const [showSeatForm, setShowSeatForm] = useState(false);
  const [editSeat, setEditSeat] = useState<Seat | null>(null);

  const [form, setForm] = useState({
    seatNumber: "",
    status: "AVAILABLE",
  });

  const [initCount, setInitCount] = useState("");

  // Load trains on mount
  useEffect(() => {
    API.get("/trains")
      .then((res) => setTrains(res.data))
      .catch(() => toast.error("Failed to load train list"));
  }, []);

  // Automatically update train number filter when trainId or trains change
  useEffect(() => {
    const selectedTrain = trains.find((t) => t.id === trainId);
    setSearchTrainNumber(selectedTrain?.trainNumber || "");
  }, [trainId, trains]);

  // Fetch seats for selected train & date
  const fetchSeats = async () => {
    if (!trainId || !date) return;
    setLoading(true);
    try {
      const res = await API.get(
        `/seats?trainId=${trainId}&departureDate=${date}`
      );
      setSeats(res.data);
    } catch {
      toast.error("Failed to fetch seats");
      setSeats([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeats();
  }, [trainId, date]);

  // Filter seats applying seat number, status, and the automatic train number filter
  const filteredSeats = seats.filter((s) => {
    const train = trains.find((t) => t.id === s.trainId);

    const matchesNumber = searchSeat
      ? s.seatNumber.toLowerCase().includes(searchSeat.toLowerCase())
      : true;

    const matchesStatus = searchStatus ? s.status === searchStatus : true;

    const matchesTrainNumber = searchTrainNumber
      ? train?.trainNumber.toLowerCase().includes(searchTrainNumber.toLowerCase())
      : true;

    return matchesNumber && matchesStatus && matchesTrainNumber;
  });

  // Reset form & editing state
  const resetForm = () => {
    setForm({ seatNumber: "", status: "AVAILABLE" });
    setEditSeat(null);
    setShowSeatForm(false);
  };

  // Handle form input changes
  const handleSeatFormChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  // Add or update seat submission
  const handleSeatSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!trainId || !date || !form.seatNumber) {
      toast.error("Choose train, date, and seat number");
      return;
    }

    try {
      if (editSeat) {
        await API.post(`/seats/update`, {
          trainId,
          departureDate: date,
          seatNumber: editSeat.seatNumber,
          status: form.status,
        });
        toast.success("Seat status updated");
      } else {
        await API.post(`/seats`, {
          trainId,
          departureDate: date,
          seatNumber: form.seatNumber,
          status: form.status,
        });
        toast.success("Seat added");
      }
      resetForm();
      fetchSeats();
    } catch {
      toast.error("Seat add/update failed");
    }
  };

  // Prepare form for editing
  const handleEdit = (seat: Seat) => {
    setEditSeat(seat);
    setForm({ seatNumber: seat.seatNumber, status: seat.status });
    setShowSeatForm(true);
  };

  // Delete seat
  const handleDelete = async (seat: Seat) => {
    if (!window.confirm("Delete this seat?")) return;

    try {
      await API.delete(
        `/seats?trainId=${seat.trainId}&departureDate=${seat.date}&seatNumber=${seat.seatNumber}`
      );
      toast.success("Seat deleted");
      fetchSeats();
    } catch {
      toast.error("Delete failed");
    }
  };

  // Change seat status and update UI optimistically
  const handleStatusChange = async (seat: Seat, newStatus: string) => {
    if (seat.status === newStatus) return;

    try {
      await API.post(`/seats/update`, {
        trainId: seat.trainId,
        departureDate: date,
        seatNumber: seat.seatNumber,
        status: newStatus,
      });
      setSeats((seats) =>
        seats.map((s) => (s.id === seat.id ? { ...s, status: newStatus } : s))
      );
      toast.success("Seat status updated");
    } catch {
      toast.error("Status update failed");
    }
  };

  // Bulk initialize seats
  const handleInitialize = async () => {
    if (!trainId || !date || !initCount) {
      toast.error("Train, date, and seat count required");
      return;
    }

    const totalSeats = Number(initCount);
    if (!totalSeats || totalSeats < 1) {
      toast.error("Seat count must be a positive number");
      return;
    }

    try {
      await API.post(
        `/seats/initialize?trainId=${trainId}&departureDate=${date}&totalSeats=${totalSeats}`
      );
      toast.success("Seats initialized");
      setInitCount("");
      fetchSeats();
    } catch {
      toast.error("Bulk initialize failed");
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Seat Management</h2>

      {/* Train and Date selectors */}
      <div className="flex flex-col md:flex-row gap-2 mb-2">
        <div>
          <Label>Train</Label>
          <select
            className="border rounded p-2"
            value={trainId}
            onChange={(e) => setTrainId(e.target.value)}
            disabled={loading}
          >
            <option value="">Select train</option>
            {trains.map((t) => (
              <option key={t.id} value={t.id}>
                {t.trainNumber} {t.source} → {t.destination}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label>Date</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      {/* Filters UI without Train # input */}
      {trainId && date && (
        <div className="flex flex-wrap gap-2 items-end mb-2">
          <Input
            className="max-w-[8rem]"
            value={searchSeat}
            onChange={(e) => setSearchSeat(e.target.value)}
            placeholder="Seat #"
          />

          <select
            className="border rounded p-2"
            value={searchStatus}
            onChange={(e) => setSearchStatus(e.target.value)}
          >
            <option value="">All Status</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            onClick={() => {
              setSearchSeat("");
              setSearchStatus("");
            }}
          >
            Clear filters
          </Button>

          <Button
            variant="default"
            onClick={() => {
              setShowSeatForm(true);
              setEditSeat(null);
            }}
          >
            + Add Seat
          </Button>

          <Input
            type="number"
            placeholder="Bulk # seats"
            className="w-24"
            value={initCount}
            min={1}
            onChange={(e) => setInitCount(e.target.value)}
          />

          <Button variant="secondary" onClick={handleInitialize}>
            Initialize All Seats
          </Button>
        </div>
      )}

      {/* Add/Edit seat form */}
      {showSeatForm && (
        <form
          onSubmit={handleSeatSubmit}
          className="mb-4 p-4 border rounded space-y-2 bg-gray-50"
        >
          <h3 className="font-semibold">{editSeat ? "Edit Seat" : "Add Seat"}</h3>

          <div className="flex flex-wrap gap-2 items-center">
            <Label>Seat Number</Label>
            <Input
              name="seatNumber"
              value={form.seatNumber}
              onChange={handleSeatFormChange}
              required
              className="max-w-[7rem]"
              disabled={Boolean(editSeat)}
            />

            <Label>Status</Label>
            <select
              name="status"
              value={form.status}
              onChange={handleSeatFormChange}
              className="border p-2 rounded"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <Button type="submit" variant="default">
              {editSeat ? "Save" : "Add"}
            </Button>

            <Button type="button" variant="outline" onClick={resetForm}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Seats table */}
      {trainId && date && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border rounded">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border-b">Seat Number</th>
                <th className="p-2 border-b">Train #</th>
                <th className="p-2 border-b">Status</th>
                <th className="p-2 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center">
                    Loading...
                  </td>
                </tr>
              ) : filteredSeats.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400">
                    No seats found for this train & date.
                  </td>
                </tr>
              ) : (
                filteredSeats.map((seat) => {
                  const train = trains.find((t) => t.id === seat.trainId);
                  return (
                    <tr key={seat.id}>
                      <td className="border-b p-2">{seat.seatNumber}</td>
                      <td className="border-b p-2">{train?.trainNumber ?? "—"}</td>
                      <td className="border-b p-2">
                        <select
                          value={seat.status}
                          onChange={(e) => handleStatusChange(seat, e.target.value)}
                          className="border p-1 rounded"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="border-b p-2 flex gap-1">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleEdit(seat)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(seat)}
                        >
                          Delete
                        </Button>
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


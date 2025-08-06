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

type TrainRun = {
  id: string;
  trainNumber: string;
  name?: string;
  source: string;
  destination: string;
  departureDate: string;
};

const STATUS_OPTIONS = ["AVAILABLE", "BOOKED"];

export default function SeatManagement() {
  const [searchTrainNumber, setSearchTrainNumber] = useState("");
  const [trainRuns, setTrainRuns] = useState<TrainRun[]>([]);
  const [selectedTrainId, setSelectedTrainId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(false);

  // Seat search filters
  const [searchSeat, setSearchSeat] = useState("");
  const [searchStatus, setSearchStatus] = useState("");

  // Seat form state
  const [showSeatForm, setShowSeatForm] = useState(false);
  const [editSeat, setEditSeat] = useState<Seat | null>(null);
  const [form, setForm] = useState({
    seatNumber: "",
    status: "AVAILABLE",
  });

  // Load trains filtered by train number when searchTrainNumber changes
  useEffect(() => {
    if (!searchTrainNumber.trim()) {
      setTrainRuns([]);
      setSelectedTrainId("");
      setSelectedDate("");
      return;
    }

    API.get(`/trains?trainNumber=${encodeURIComponent(searchTrainNumber.trim())}`)
      .then((res) => {
        const runs = res.data.map((t: any) => ({
          id: t.id,
          trainNumber: t.trainNumber,
          name: t.name,
          source: t.source,
          destination: t.destination,
          departureDate: t.departureDate,
        }));
        setTrainRuns(runs);

        // Auto-select if only 1 run found
        if (runs.length === 1) {
          setSelectedTrainId(runs[0].id);
          setSelectedDate(runs[0].departureDate);
        } else {
          setSelectedTrainId("");
          setSelectedDate("");
        }

        setSeats([]);
        resetForm();
      })
      .catch(() => {
        toast.error("Failed to fetch trains by train number");
        setTrainRuns([]);
        setSelectedTrainId("");
        setSelectedDate("");
        setSeats([]);
        resetForm();
      });
  }, [searchTrainNumber]);

  // Fetch seats whenever selectedTrainId or selectedDate changes
  useEffect(() => {
    if (!selectedTrainId || !selectedDate) {
      setSeats([]);
      return;
    }

    setLoading(true);
    API.get(`/seats?trainId=${selectedTrainId}&departureDate=${selectedDate}`)
      .then((res) => setSeats(res.data))
      .catch(() => {
        toast.error("Failed to fetch seats");
        setSeats([]);
      })
      .finally(() => setLoading(false));
  }, [selectedTrainId, selectedDate]);

  // Filter seats by seat number and status
  const filteredSeats = seats.filter((s) => {
    const matchesNumber = searchSeat ? s.seatNumber.toLowerCase().includes(searchSeat.toLowerCase()) : true;
    const matchesStatus = searchStatus ? s.status === searchStatus : true;
    return matchesNumber && matchesStatus;
  });

  const resetForm = () => {
    setForm({ seatNumber: "", status: "AVAILABLE" });
    setEditSeat(null);
    setShowSeatForm(false);
  };

  const handleSeatFormChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  // Add or update seat
  const handleSeatSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedTrainId || !selectedDate || !form.seatNumber) {
      toast.error("Choose train, date, and seat number");
      return;
    }
    try {
      if (editSeat) {
        await API.post(`/seats/update`, {
          trainId: selectedTrainId,
          departureDate: selectedDate,
          seatNumber: editSeat.seatNumber,
          status: form.status,
        });
        toast.success("Seat status updated");
      } else {
        await API.post(`/seats`, {
          trainId: selectedTrainId,
          departureDate: selectedDate,
          seatNumber: form.seatNumber,
          status: form.status,
        });
        toast.success("Seat added");
      }
      resetForm();
      // Refresh seats after add/update
      const res = await API.get(`/seats?trainId=${selectedTrainId}&departureDate=${selectedDate}`);
      setSeats(res.data);
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
      await API.delete(`/seats?trainId=${seat.trainId}&departureDate=${seat.date}&seatNumber=${seat.seatNumber}`);
      toast.success("Seat deleted");
      // Refresh seats after deletion
      const res = await API.get(`/seats?trainId=${selectedTrainId}&departureDate=${selectedDate}`);
      setSeats(res.data);
    } catch {
      toast.error("Delete failed");
    }
  };

  // Change seat status
  const handleStatusChange = async (seat: Seat, newStatus: string) => {
    if (seat.status === newStatus) return;
    try {
      await API.post(`/seats/update`, {
        trainId: seat.trainId,
        departureDate: selectedDate,
        seatNumber: seat.seatNumber,
        status: newStatus,
      });
      setSeats((currentSeats) =>
        currentSeats.map((s) => (s.id === seat.id ? { ...s, status: newStatus } : s))
      );
      toast.success("Seat status updated");
    } catch {
      toast.error("Status update failed");
    }
  };

  // Bulk initialize seats
  const [initCount, setInitCount] = useState("");
  const handleInitialize = async () => {
    if (!selectedTrainId || !selectedDate || !initCount) {
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
        `/seats/initialize?trainId=${selectedTrainId}&departureDate=${selectedDate}&totalSeats=${totalSeats}`
      );
      toast.success("Seats initialized");
      setInitCount("");
      // Refresh seats after initialization
      const res = await API.get(`/seats?trainId=${selectedTrainId}&departureDate=${selectedDate}`);
      setSeats(res.data);
    } catch {
      toast.error("Bulk initialize failed");
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Seat Management</h2>

      <div className="mb-4">
        <Label>Search by Train Number</Label>
        <Input
          placeholder="Enter Train Number (e.g. 13039)"
          value={searchTrainNumber}
          onChange={(e) => setSearchTrainNumber(e.target.value)}
          className="mb-2"
        />
      </div>

      <div className="mb-4">
        <Label>Available Train Runs</Label>
        <select
          className="w-full rounded border p-2"
          value={selectedTrainId}
          onChange={(e) => {
            const selectedId = e.target.value;
            setSelectedTrainId(selectedId);
            const trainRun = trainRuns.find((r) => r.id === selectedId);
            setSelectedDate(trainRun?.departureDate || "");
            resetForm();
          }}
          disabled={trainRuns.length === 0}
        >
          <option value="">-- Select Train and Date --</option>
          {trainRuns.map((run) => (
            <option key={run.id} value={run.id}>
              {run.trainNumber} • {run.departureDate} • {run.source} → {run.destination}
            </option>
          ))}
        </select>
      </div>

      {selectedTrainId && selectedDate && (
        <>
          <div className="mb-4 flex flex-wrap gap-2 items-end">
            <Input
              className="max-w-[8rem]"
              value={searchSeat}
              onChange={(e) => setSearchSeat(e.target.value)}
              placeholder="Search Seat #"
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

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border rounded">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border-b">Seat Number</th>
                  <th className="p-2 border-b">Status</th>
                  <th className="p-2 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center">
                      Loading...
                    </td>
                  </tr>
                ) : filteredSeats.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-gray-400">
                      No seats found.
                    </td>
                  </tr>
                ) : (
                  filteredSeats.map((seat) => (
                    <tr key={seat.id}>
                      <td className="border-b p-2">{seat.seatNumber}</td>
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

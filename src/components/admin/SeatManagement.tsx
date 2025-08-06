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
  date: string; // departureDate
  status: string;
};

type TrainRun = {
  id: string;
  trainNumber: number;
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
  const [loadingSeats, setLoadingSeats] = useState(false);

  const [searchSeatNumber, setSearchSeatNumber] = useState("");
  const [searchStatus, setSearchStatus] = useState("");

  const [showSeatForm, setShowSeatForm] = useState(false);
  const [editSeat, setEditSeat] = useState<Seat | null>(null);

  const [form, setForm] = useState({
    seatNumber: "",
    status: "AVAILABLE",
  });

  // Effect: Fetch train runs matching trainNumber
  useEffect(() => {
    if (!searchTrainNumber.trim()) {
      setTrainRuns([]);
      setSelectedTrainId("");
      setSelectedDate("");
      setSeats([]);
      resetForm();
      return;
    }

    API.get(`/trains/search?trainNumber=${encodeURIComponent(searchTrainNumber.trim())}`)
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

        if (runs.length === 1) {
          setSelectedTrainId(runs[0].id);
          setSelectedDate(runs[0].departureDate);
        } else {
          setSelectedTrainId("");
          setSelectedDate("");
          setSeats([]);
        }
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

  // Effect: Fetch seats for selected run + date
  useEffect(() => {
    if (!selectedTrainId || !selectedDate) {
      setSeats([]);
      return;
    }
    setLoadingSeats(true);
    API.get(`/seats?trainId=${selectedTrainId}&departureDate=${selectedDate}`)
      .then((res) => setSeats(res.data))
      .catch(() => {
        toast.error("Failed to fetch seats");
        setSeats([]);
      })
      .finally(() => setLoadingSeats(false));
  }, [selectedTrainId, selectedDate]);

  // Filter seats locally for seatNumber and status filters
  const filteredSeats = seats.filter((s) => {
    const matchesNumber = searchSeatNumber
      ? s.seatNumber.toLowerCase().includes(searchSeatNumber.toLowerCase())
      : true;
    const matchesStatus = searchStatus ? s.status === searchStatus : true;
    return matchesNumber && matchesStatus;
  });

  const resetForm = () => {
    setForm({ seatNumber: "", status: "AVAILABLE" });
    setEditSeat(null);
    setShowSeatForm(false);
  };

  const handleFormChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedTrainId || !selectedDate || !form.seatNumber) {
      toast.error("Please select a train run and enter seat number");
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
      // Refresh seats list
      const res = await API.get(`/seats?trainId=${selectedTrainId}&departureDate=${selectedDate}`);
      setSeats(res.data);
    } catch {
      toast.error("Seat add/update failed");
    }
  };

  const handleEdit = (seat: Seat) => {
    setEditSeat(seat);
    setForm({ seatNumber: seat.seatNumber, status: seat.status });
    setShowSeatForm(true);
  };

  const handleDelete = async (seat: Seat) => {
    if (!window.confirm("Are you sure you want to delete this seat?")) return;
    try {
      await API.delete(
        `/seats?trainId=${seat.trainId}&departureDate=${seat.date}&seatNumber=${seat.seatNumber}`
      );
      toast.success("Seat deleted");
      // Refresh seats list
      const res = await API.get(`/seats?trainId=${selectedTrainId}&departureDate=${selectedDate}`);
      setSeats(res.data);
    } catch {
      toast.error("Seat deletion failed");
    }
  };

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
      toast.error("Failed to update seat status");
    }
  };

  // Bulk initialize seats state & handler omitted here - keep as you have

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Seat Management</h2>

      <div className="mb-4">
        <Label>Search Train Number</Label>
        <Input
          placeholder="Enter Train Number (e.g., 13039)"
          value={searchTrainNumber}
          onChange={(e) => setSearchTrainNumber(e.target.value)}
          className="mb-3"
          autoComplete="off"
        />

        <Label>Available Train Runs</Label>
        <select
          className="w-full rounded border p-2 mb-4"
          value={selectedTrainId}
          onChange={(e) => {
            const trainId = e.target.value;
            setSelectedTrainId(trainId);
            const run = trainRuns.find((r) => r.id === trainId);
            setSelectedDate(run?.departureDate || "");
            resetForm();
          }}
          disabled={trainRuns.length === 0}
          aria-label="Select Train Run"
        >
          <option value="">-- Select Train & Date --</option>
          {trainRuns.map((run) => (
            <option key={run.id} value={run.id}>
              {run.trainNumber} • {run.departureDate} • {run.source} → {run.destination}
            </option>
          ))}
        </select>
      </div>

      {selectedTrainId && selectedDate && (
        <>
          <div className="mb-4 flex flex-wrap gap-2 items-center">
            <Input
              className="max-w-[8rem]"
              placeholder="Filter Seat #"
              value={searchSeatNumber}
              onChange={(e) => setSearchSeatNumber(e.target.value)}
            />

            <select
              className="border rounded p-2"
              value={searchStatus}
              onChange={(e) => setSearchStatus(e.target.value)}
              aria-label="Filter Seat Status"
            >
              <option value="">All Status</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchSeatNumber("");
                setSearchStatus("");
              }}
            >
              Clear Filters
            </Button>

            <Button
              variant="default"
              onClick={() => {
                resetForm();
                setShowSeatForm(true);
              }}
            >
              + Add Seat
            </Button>

            {/* Place Bulk Initialize seats input/button here, if you have */}
          </div>

          {showSeatForm && (
            <form
              onSubmit={handleFormSubmit}
              className="mb-6 p-4 border rounded bg-gray-50 space-y-3 max-w-md"
            >
              <h3 className="font-semibold">{editSeat ? "Edit Seat" : "Add Seat"}</h3>
              <div className="flex flex-wrap gap-2 items-center">
                <Label htmlFor="seatNumber">Seat Number</Label>
                <Input
                  id="seatNumber"
                  name="seatNumber"
                  value={form.seatNumber}
                  onChange={handleFormChange}
                  required
                  className="max-w-[7rem]"
                  disabled={!!editSeat}
                />

                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  value={form.status}
                  onChange={handleFormChange}
                  className="border p-2 rounded"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>

                <Button type="submit" variant="default" className="ml-auto">
                  {editSeat ? "Save" : "Add"}
                </Button>

                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full border rounded text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border-b text-left">Seat Number</th>
                  <th className="p-2 border-b text-left">Status</th>
                  <th className="p-2 border-b"></th>
                </tr>
              </thead>
              <tbody>
                {loadingSeats ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center">
                      Loading seats...
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
                          aria-label={`Change status for seat ${seat.seatNumber}`}
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="border-b p-2 flex gap-2 justify-end">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleEdit(seat)}
                          aria-label={`Edit seat ${seat.seatNumber}`}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(seat)}
                          aria-label={`Delete seat ${seat.seatNumber}`}
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

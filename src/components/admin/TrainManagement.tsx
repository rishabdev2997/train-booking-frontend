"use client";

import { useEffect, useState } from "react";
import API from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type Train = {
  id: string;
  trainNumber: number; // Number type as per backend entity
  source: string;
  destination: string;
  departureDate: string;
  departureTime: string;
  arrivalTime: string;
  totalSeats: number;
};

const initialTrain = {
  trainNumber: "",
  source: "",
  destination: "",
  departureDate: "",
  departureTime: "",
  arrivalTime: "",
  totalSeats: "",
};

export default function TrainManagement() {
  const [trains, setTrains] = useState<Train[]>([]);
  const [addTrain, setAddTrain] = useState({ ...initialTrain });
  const [editTrain, setEditTrain] = useState<Train | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Search fields
  const [searchTrainNumber, setSearchTrainNumber] = useState("");
  const [searchSource, setSearchSource] = useState("");
  const [searchDestination, setSearchDestination] = useState("");
  const [searchDate, setSearchDate] = useState("");

  // Fetch trains with backend filtering
  const fetchTrains = async () => {
    try {
      const params: Record<string, string> = {};
      if (searchTrainNumber.trim()) params.trainNumber = searchTrainNumber.trim();
      if (searchSource.trim()) params.source = searchSource.trim();
      if (searchDestination.trim()) params.destination = searchDestination.trim();
      if (searchDate.trim()) params.departureDate = searchDate.trim();

      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `/trains/search?${queryString}` : "/trains";

      const res = await API.get(url);
      setTrains(res.data);
    } catch (err) {
      toast.error("Error fetching trains");
      console.error(err);
    }
  };

  // Refetch whenever search filters change
  useEffect(() => {
    fetchTrains();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTrainNumber, searchSource, searchDestination, searchDate]);

  const handleAdd = async () => {
    try {
      const payload = {
        ...addTrain,
        trainNumber: Number(addTrain.trainNumber),
        totalSeats: Number(addTrain.totalSeats),
      };
      await API.post("/trains", payload);
      toast.success("Train added");
      setAddTrain({ ...initialTrain });
      setAddOpen(false);
      fetchTrains();
    } catch (err) {
      toast.error("Add failed");
      console.error(err);
    }
  };

  const handleEdit = async () => {
    if (!editTrain) return;
    try {
      const payload = {
        ...editTrain,
        trainNumber: Number(editTrain.trainNumber),
        totalSeats: Number(editTrain.totalSeats),
      };
      await API.put(`/trains/${editTrain.id}`, payload);
      toast.success("Train updated");
      setEditTrain(null);
      setEditDialogOpen(false);
      fetchTrains();
    } catch (err) {
      toast.error("Update failed");
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await API.delete(`/trains/${id}`);
      toast.success("Train deleted");
      fetchTrains();
    } catch (err) {
      toast.error("Delete failed");
      console.error(err);
    }
  };

  // Add/Edit form UI
  const renderForm = (
    train: any,
    setTrain: (val: any) => void,
    onSubmit: () => void,
    isEdit = false
  ) => {
    if (!train) return <div>Loading...</div>;
    return (
      <div className="grid gap-3 py-4">
        {[
          "trainNumber",
          "source",
          "destination",
          "departureDate",
          "departureTime",
          "arrivalTime",
          "totalSeats",
        ].map((field) => (
          <div key={field}>
            <Label htmlFor={field}>{field}</Label>
            <Input
              id={field}
              type={
                field.includes("Date")
                  ? "date"
                  : field.includes("Time")
                  ? "time"
                  : field === "totalSeats" || field === "trainNumber"
                  ? "number"
                  : "text"
              }
              value={train[field as keyof typeof train]}
              onChange={(e) =>
                setTrain((prev: any) => ({ ...prev, [field]: e.target.value }))
              }
            />
          </div>
        ))}
        <Button type="button" onClick={onSubmit}>
          {isEdit ? "Update" : "Submit"}
        </Button>
      </div>
    );
  };

  // Display first 5 trains for UI
  const visibleTrains = trains.slice(0, 5);

  // Functions to open and close edit dialog
  const openEditDialog = (train: Train) => {
    setEditTrain(train);
    setEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setEditTrain(null);
    setEditDialogOpen(false);
  };

  return (
    <div className="p-4 space-y-6">
      {/* Add Train Dialog */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">🚆 Train Management</h2>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setAddOpen(true)}>Add Train</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Train</DialogTitle>
            </DialogHeader>
            {renderForm(addTrain, setAddTrain, handleAdd)}
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter Inputs */}
      <div className="flex gap-2 max-w-3xl mb-3">
        <Input
          placeholder="Train Number"
          type="number"
          value={searchTrainNumber}
          onChange={(e) => setSearchTrainNumber(e.target.value)}
        />
        <Input
          placeholder="Source"
          value={searchSource}
          onChange={(e) => setSearchSource(e.target.value)}
        />
        <Input
          placeholder="Destination"
          value={searchDestination}
          onChange={(e) => setSearchDestination(e.target.value)}
        />
        <Input
          type="date"
          placeholder="Departure Date"
          value={searchDate}
          onChange={(e) => setSearchDate(e.target.value)}
        />
        <Button
          variant="outline"
          onClick={() => {
            setSearchTrainNumber("");
            setSearchSource("");
            setSearchDestination("");
            setSearchDate("");
          }}
        >
          Clear
        </Button>
      </div>

      <div className="text-sm text-muted-foreground mb-2">
        Showing {visibleTrains.length} of {trains.length} result(s)
      </div>

      {/* Trains List */}
      <ul className="grid gap-4">
        {visibleTrains.length === 0 && (
          <li className="text-center text-gray-400 py-8">No trains found.</li>
        )}

        {visibleTrains.map((train) => (
          <li
            key={train.id}
            className="border rounded p-4 flex justify-between items-start shadow-sm"
          >
            <div>
              <p className="text-lg font-semibold">Train #{train.trainNumber}</p>
              <p className="text-muted-foreground">
                {train.source} → {train.destination}
              </p>
              <p className="text-sm">
                {train.departureDate} | {train.departureTime} → {train.arrivalTime}
              </p>
              <p className="text-sm text-muted-foreground">
                Seats: {train.totalSeats}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Dialog open={editDialogOpen} onOpenChange={(open) => !open && closeEditDialog()}>
                <DialogTrigger asChild>
                  <Button variant="outline" onClick={() => openEditDialog(train)}>
                    Edit
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Train</DialogTitle>
                  </DialogHeader>
                  {editTrain ? renderForm(editTrain, setEditTrain, handleEdit, true) : <p>Loading...</p>}
                </DialogContent>
              </Dialog>
              <Button variant="destructive" onClick={() => handleDelete(train.id)}>
                Delete
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

interface Train {
  id: string;
  trainNumber: string;
  [key: string]: any;
}

interface Seat {
  id: string;
  seatNumber: string;
  status: "available" | "booked";
  trainId: string;
  [key: string]: any;
}


export default function AdminSeatsPage() {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [trains, setTrains] = useState<Train[]>([]);
  const [searchSeat, setSearchSeat] = useState("");
  const [searchStatus, setSearchStatus] = useState("");
  const [searchTrainNumber, setSearchTrainNumber] = useState("");

  useEffect(() => {
    const fetchSeatsAndTrains = async () => {
      try {
        const [seatsRes, trainsRes] = await Promise.all([
          axios.get("/api/seats"),
          axios.get("/api/trains"),
        ]);
        setSeats(seatsRes.data);
        setTrains(trainsRes.data);
      } catch (error) {
        console.error("Failed to fetch seats or trains", error);
        toast.error("Failed to fetch seat/train data");
      }
    };

    fetchSeatsAndTrains();
  }, []);

  const filteredSeats = Array.isArray(seats)
    ? seats.filter((s) => {
        try {
          const train = trains.find((t) => t?.id === s?.trainId);

          const matchesNumber = searchSeat
            ? s?.seatNumber?.toLowerCase().includes(searchSeat.toLowerCase())
            : true;

          const matchesStatus = searchStatus ? s?.status === searchStatus : true;

          const matchesTrainNumber = searchTrainNumber
            ? train?.trainNumber
                ?.toLowerCase()
                .includes(searchTrainNumber.toLowerCase()) ?? false
            : true;

          return matchesNumber && matchesStatus && matchesTrainNumber;
        } catch (err) {
          console.error("Error filtering seat:", err, s);
          return false;
        }
      })
    : [];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Manage Seats</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="seatNumber">Search by Seat Number</Label>
          <Input
            id="seatNumber"
            placeholder="A1"
            value={searchSeat}
            onChange={(e) => setSearchSeat(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="status">Filter by Status</Label>
          <select
            id="status"
            className="w-full border rounded px-3 py-2"
            value={searchStatus}
            onChange={(e) => setSearchStatus(e.target.value)}
          >
            <option value="">All</option>
            <option value="available">Available</option>
            <option value="booked">Booked</option>
          </select>
        </div>
        <div>
          <Label htmlFor="train">Search by Train Number</Label>
          <Input
            id="train"
            placeholder="12345"
            value={searchTrainNumber}
            onChange={(e) => setSearchTrainNumber(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSeats.map((seat) => {
          const train = trains.find((t) => t?.id === seat?.trainId);
          return (
            <Card key={seat.id}>
              <CardContent className="p-4 space-y-2">
                <div className="text-lg font-semibold">Seat: {seat?.seatNumber}</div>
                <div>Status: {seat?.status}</div>
                <div>Train: {train?.trainNumber ?? "Unknown"}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

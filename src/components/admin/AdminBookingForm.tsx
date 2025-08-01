"use client";

import { useState, useEffect } from 'react';
import API from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import SeatLayout from '@/components/SeatLayout';
import TrainCard from '@/components/TrainCard';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Universal form: role="ADMIN" or role="USER"
// Optional: onBookingSuccess callback for parent dashboards
export default function AdminBookingForm({
  role = "ADMIN",
  onBookingSuccess,
}: {
  role?: "ADMIN" | "USER";
  onBookingSuccess?: () => void;
}) {
  const [form, setForm] = useState({
    trainId: '',
    userId: '',
    journeyDate: '',
    seatNumbers: [] as string[],
  });
  const [selectedTrain, setSelectedTrain] = useState<any | null>(null);
  const [trains, setTrains] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [seats, setSeats] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Train search controls
  const [searchTrainNumber, setSearchTrainNumber] = useState('');
  const [searchSource, setSearchSource] = useState('');
  const [searchDestination, setSearchDestination] = useState('');

  // Confirmation dialog state
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [confirmationDetails, setConfirmationDetails] = useState<any | null>(null);

  // Load data
  useEffect(() => {
    API.get('/trains').then(res => setTrains(res.data));
    if (role === "ADMIN") API.get('/users').then(res => setUsers(res.data));
    API.get('/auth/me').then(res => setCurrentUser(res.data)).catch(() => {});
  }, [role]);

  // For USER: always enforce own userId
  useEffect(() => {
    if (role !== "ADMIN" && currentUser) {
      setForm(f => ({ ...f, userId: currentUser.id }));
    }
  }, [role, currentUser]);

  // Filter train list
  const filteredTrains = trains.filter((t) => {
    const matchesTrainNumber = searchTrainNumber
      ? t.trainNumber?.toLowerCase().includes(searchTrainNumber.toLowerCase())
      : true;
    const matchesSource = searchSource
      ? t.source?.toLowerCase().includes(searchSource.toLowerCase())
      : true;
    const matchesDestination = searchDestination
      ? t.destination?.toLowerCase().includes(searchDestination.toLowerCase())
      : true;
    return matchesTrainNumber && matchesSource && matchesDestination;
  });

  // Update seats when train/date changes
  useEffect(() => {
    if (form.trainId && form.journeyDate) {
      API.get(`/seats?trainId=${form.trainId}&departureDate=${form.journeyDate}`)
        .then(res => {
          setSeats(res.data.filter((s: any) => s.status === 'AVAILABLE').map((s: any) => s.seatNumber));
        })
        .catch(() => setSeats([]));
    } else {
      setSeats([]);
    }
    setForm(f => ({ ...f, seatNumbers: [] }));
  }, [form.trainId, form.journeyDate]);

  function userLabel(user: any) {
    if (user.firstName || user.lastName)
      return `${user.firstName ?? ''} ${user.lastName ?? ''} (${user.email})`;
    return user.username || user.email || user.id;
  }

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (name === "trainId") {
      const tr = trains.find((t: any) => t.id === value);
      setSelectedTrain(tr ?? null);
    }
  };

  // Only admin: "Book for myself" button
  const bookForMe = () => {
    if (currentUser) setForm(f => ({ ...f, userId: currentUser.id }));
  };

  const handleSeatSelection = (seatNumbers: string[]) => setForm(f => ({ ...f, seatNumbers }));

  // Click a TrainCard to select, also set journeyDate
  const handleTrainCardClick = (train: any) => {
    setSelectedTrain(train);
    setForm(f => ({
      ...f,
      trainId: train.id,
      journeyDate: train.departureDate || ''
    }));
  };

  // Submit
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      const payload = {
        trainId: form.trainId,
        userId: role === "ADMIN" ? form.userId : currentUser?.id,
        journeyDate: form.journeyDate,
        seatNumbers: form.seatNumbers,
      };
      await API.post('/bookings', payload);

      // Confirmation
      const train = trains.find(t => t.id === form.trainId);
      const user = (role === "ADMIN"
        ? users.find(u => u.id === payload.userId)
        : currentUser);
      setConfirmationDetails({
        ...payload,
        train: train ? `${train.trainNumber} • ${train.source} → ${train.destination}` : form.trainId,
        trainObj: train,
        user: user ? `${user.firstName ?? ''} ${user.lastName ?? ''} (${user.email})` : payload.userId,
        userObj: user,
      });
      setConfirmationOpen(true);

      toast.success('Booking created successfully');
      setForm({ trainId: '', userId: role === "ADMIN" ? '' : (currentUser?.id || ''), journeyDate: '', seatNumbers: [] });
      setSelectedTrain(null);
      setSeats([]);
      if (onBookingSuccess) onBookingSuccess();
    } catch (err) {
      toast.error('Booking failed');
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-xl font-semibold mb-2">
          Create Booking {role === "ADMIN" ? "(Admin)" : ""}
        </h2>
        {/* Train search fields and clickable cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
          <Input placeholder="Train Number" value={searchTrainNumber} onChange={e => setSearchTrainNumber(e.target.value)} />
          <Input placeholder="Source" value={searchSource} onChange={e => setSearchSource(e.target.value)} />
          <Input placeholder="Destination" value={searchDestination} onChange={e => setSearchDestination(e.target.value)} />
        </div>
        <Button
          variant="outline"
          onClick={e => {
            e.preventDefault();
            setSearchTrainNumber('');
            setSearchSource('');
            setSearchDestination('');
          }}
          className="mb-2"
          type="button"
        >
          Clear
        </Button>
        <div className="text-xs text-muted-foreground mb-2">
          Showing {Math.min(filteredTrains.length, 5)} of {filteredTrains.length} trains
        </div>
        <div className="mb-2 flex flex-wrap gap-2">
          {filteredTrains.length === 0 ? (
            <div className="text-center text-gray-400 p-2 w-full">No trains found.</div>
          ) : (
            filteredTrains.slice(0, 5).map(train => (
              <div
                key={train.id}
                style={{ width: "300px", minWidth: "250px", cursor: "pointer" }}
                onClick={() => handleTrainCardClick(train)}
              >
                <TrainCard train={train} selected={form.trainId === train.id} />
              </div>
            ))
          )}
        </div>
        {/* Train select fallback for accessibility (optional) */}
        <div>
          <Label>Train (dropdown fallback)</Label>
          <select
            name="trainId"
            value={form.trainId}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          >
            <option value="">Select Train</option>
            {filteredTrains.slice(0, 5).map(train => (
              <option key={train.id} value={train.id}>
                {train.trainNumber ? `${train.trainNumber} • ${train.source} → ${train.destination}` : train.name || train.id}
                {train.departureTime ? ` • ${train.departureTime}` : ''}
              </option>
            ))}
          </select>
        </div>
        {/* User select: only for ADMIN */}
        {role === "ADMIN" && (
          <div>
            <Label>User</Label>
            <div className="flex gap-2 mb-1">
              <select
                name="userId"
                value={form.userId}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                required
              >
                <option value="">Select User</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{userLabel(user)}</option>
                ))}
              </select>
              {currentUser && (
                <Button type="button" variant="outline" onClick={bookForMe}>
                  Book for myself
                </Button>
              )}
            </div>
          </div>
        )}
        <div>
          <Label>Journey Date</Label>
          <Input
            type="date"
            name="journeyDate"
            value={form.journeyDate}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Label>Select Seat(s)</Label>
          {!form.trainId || !form.journeyDate ? (
            <div className="text-sm text-gray-400">Select train &amp; date to show seats</div>
          ) : seats.length === 0 ? (
            <div className="text-sm text-red-400">No available seats for this train and date.</div>
          ) : (
            <SeatLayout
              seats={seats}
              selected={form.seatNumbers}
              seatsPerRow={8}
              onChange={handleSeatSelection}
            />
          )}
          <div className="text-xs text-gray-600">Click to select/deselect seats. Scroll for more seats if many.</div>
        </div>
        <Button type="submit"
          disabled={
            !form.trainId ||
            !form.journeyDate ||
            form.seatNumbers.length === 0 ||
            (role === "ADMIN" && !form.userId)
          }
        >
          Book Ticket
        </Button>
      </form>
      {/* Booking confirmation dialog */}
      <Dialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Booking Confirmed!</DialogTitle>
          </DialogHeader>
          {confirmationDetails && (
            <div className="space-y-2">
              {confirmationDetails.trainObj &&
                <TrainCard train={confirmationDetails.trainObj} />}
              <div>
                <span className="font-semibold">User:</span> {confirmationDetails.user}
              </div>
              <div>
                <span className="font-semibold">Journey Date:</span> {confirmationDetails.journeyDate}
              </div>
              <div>
                <span className="font-semibold">Seats:</span> {confirmationDetails.seatNumbers.join(', ')}
              </div>
              <div className="pt-2">
                <Button onClick={() => {
                  setConfirmationOpen(false);
                  if (onBookingSuccess) onBookingSuccess();
                }}>Done</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

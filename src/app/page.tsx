'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import API from '@/lib/api';
import TrainCard from '@/components/TrainCard';
import HeroSection from '@/components/HeroSection';

export default function LandingPage() {
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [trains, setTrains] = useState([]);
  const router = useRouter();

  const searchTrains = async () => {
    try {
      const res = await API.get(
        `/trains/search?source=${source}&destination=${destination}&departureDate=${date}`
      );
      setTrains(res.data);
    } catch (err) {
      console.error('Train search failed:', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-between px-4 py-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-950">
      <HeroSection />

      {/* Train Search Section */}
      <div className="w-full max-w-xl text-center space-y-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">🚆 Search Trains</h1>
        <div className="flex flex-wrap justify-center gap-2">
          <input
            placeholder="From"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="border p-2 rounded w-32"
          />
          <input
            placeholder="To"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="border p-2 rounded w-32"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border p-2 rounded"
          />
          <button
            onClick={searchTrains}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Search
          </button>
        </div>
        <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
          {trains.length > 0 ? (
            trains.map((t: any) => <TrainCard key={t.id} train={t} />)
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No trains found. Try a search.</p>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px w-full max-w-2xl bg-gray-300 dark:bg-gray-700 my-4" />

      {/* Login to Test Section */}
      <div className="text-center space-y-2 mb-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">🔐 Login to Test</h2>
        <p className="text-gray-600 dark:text-gray-300 text-sm">
          Use the demo credentials to try booking:
        </p>
        <button
          onClick={() => router.push('/login')}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
        >
          Go to Login
        </button>
      </div>
    </div>
  );
}

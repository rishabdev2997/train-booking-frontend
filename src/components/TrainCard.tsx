import React from 'react';

export default function TrainCard({ train, selected }: { train: any; selected?: boolean }) {
  return (
    <div className={`border rounded p-4 shadow-sm mb-2 ${selected ? "ring-2 ring-blue-500" : ""}`}>
      <h2 className="text-lg font-bold">
        {train.name || train.trainNumber} ({train.trainNumber})
      </h2>
      <p>{train.source} → {train.destination}</p>
      <p>Date: {train.departureDate}</p>
      <p>Time: {train.departureTime} → {train.arrivalTime}</p>
    </div>
  );
}

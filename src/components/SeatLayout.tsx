import React from 'react';

export default function SeatLayout({
  seats,
  selected,
  onChange,
  disabledSeats = [],
  seatsPerRow = 20,
  containerWidth = 375,
  containerHeight = 450,
}: {
  seats: string[];  // e.g. ["1", "2", ..., "400"]
  selected: string[];
  onChange: (selected: string[]) => void;
  seatsPerRow?: number;
  disabledSeats?: string[];
  containerWidth?: number;  // px
  containerHeight?: number; // px
}) {
  // Compose rows
  const rows: string[][] = [];
  for (let i = 0; i < seats.length; i += seatsPerRow) {
    rows.push(seats.slice(i, i + seatsPerRow));
  }

  return (
    <div
      className="overflow-x-auto overflow-y-auto border rounded bg-white"
      style={{ maxWidth: containerWidth, maxHeight: containerHeight, minWidth: 340, minHeight: 150 }}
    >
      <div className="inline-block">
        {rows.map((row, i) => (
          <div key={i} className="flex gap-1 mb-1">
            {row.map(seat => {
              const isSelected = selected.includes(seat);
              const isDisabled = disabledSeats.includes(seat);
              return (
                <button
                  key={seat}
                  type="button"
                  className={`
                    w-10 h-8 border rounded font-mono text-xs
                    ${isSelected ? "bg-blue-500 text-white" : "bg-gray-100"}
                    ${isDisabled ? "opacity-40 cursor-not-allowed" : isSelected ? "ring-2 ring-blue-600" : "hover:bg-blue-100"}
                    flex items-center justify-center select-none
                  `}
                  onClick={() =>
                    !isDisabled &&
                    onChange(isSelected
                      ? selected.filter(s => s !== seat)
                      : [...selected, seat]
                    )
                  }
                  disabled={isDisabled}
                >
                  {seat}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
